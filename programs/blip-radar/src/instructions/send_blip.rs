use anchor_lang::prelude::*;
use anchor_lang::system_program::{self, transfer, Transfer};

use mpl_core::instructions::CreateV2CpiBuilder;

use crate::constants::AUTHORITY;
use crate::errors::BlipRadarError;
use crate::state::{BlipConfig};

pub fn send_blip<'info>(
    ctx: Context<'_, '_, '_, 'info, SendBlip<'info>>,
    asset_json_uri: String,
) -> Result<()> {
    msg!("Sending blip {} ", asset_json_uri);
    let asset_account = &ctx.accounts.asset;
    let payer_account = &ctx.accounts.payer;
    let receiver_account = &ctx.accounts.receiver;
    let collection_account = &ctx.accounts.collection;
    let collection_authority_account = &ctx.accounts.collection_authority;
    let fee_escrow_account = &ctx.accounts.fee_escrow;
    let mpl_core_program = &ctx.accounts.mpl_core_program;
    let system_program = &ctx.accounts.system_program;
    let config_account = &ctx.accounts.config;
    let remaining_accounts = &ctx.remaining_accounts;

    let fee_lamports = config_account.fee_lamports;
    let fee_shares = &config_account.fee_shares;

    require_keys_eq!(
        collection_authority_account.key(),
        AUTHORITY,
        BlipRadarError::InvalidAuthority
    );

    CreateV2CpiBuilder::new(mpl_core_program)
        .asset(asset_account)
        .collection(Some(collection_account))
        .authority(Some(collection_authority_account))
        .payer(payer_account)
        .owner(Some(receiver_account))
        .system_program(system_program)
        .name("Blip".to_string())
        .uri(asset_json_uri)
        .invoke()?;

    transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: payer_account.to_account_info(),
                to: fee_escrow_account.to_account_info(),
            },
        ),
        fee_lamports,
    )?;

    msg!("Transferred {} lamports to fee escrow", fee_lamports);

    require!(!fee_shares.is_empty(), BlipRadarError::NoFeeShareRecipients);

    for fee_share in fee_shares.iter() {
        require!(
            remaining_accounts
                .iter()
                .any(|account| account.key() == fee_share.destination),
            BlipRadarError::InvalidFeeShareRecipient
        );
    }

    let fee_escrow_bump = ctx.bumps.fee_escrow;
    let fee_escrow_seeds = &[b"fee_escrow".as_ref(), &[fee_escrow_bump]];

    let mut transfers: Vec<(AccountInfo, u64)> = vec![];
    let mut total_distributed = 0;

    for (i, fee_share) in fee_shares.iter().enumerate() {
        let recipient_account = remaining_accounts
            .iter()
            .find(|account| account.key() == fee_share.destination)
            .ok_or(BlipRadarError::InvalidFeeShareRecipient)?;

        require!(
            recipient_account.is_writable,
            BlipRadarError::FeeShareRecipientNotWritable
        );

        let transfer_amount = if i == fee_shares.len() - 1 {
            // last share gets remaining with dust
            fee_lamports - total_distributed
        } else {
            (fee_lamports * fee_share.basis_points as u64) / 10_000
        };

        total_distributed += transfer_amount;
        transfers.push((recipient_account.clone(), transfer_amount));
    }

    for (recipient, transfer_amount) in transfers {
        transfer(
            CpiContext::new_with_signer(
                system_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.fee_escrow.clone().to_account_info(),
                    to: recipient.clone().to_account_info(),
                },
                &[fee_escrow_seeds],
            ),
            transfer_amount,
        )?;

        msg!(
            "Distributed {} lamports to recipient {}",
            transfer_amount,
            recipient.key()
        );
    }

    Ok(())
}

#[derive(Accounts)]
#[instruction(asset_json_uri: String)]
pub struct SendBlip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    /// CHECK: send to whatever address
    pub receiver: UncheckedAccount<'info>,

    /// CHECK: PDA that program controls for fees escrow
    #[account(
        mut,
        seeds = [b"fee_escrow".as_ref()],
        bump,
        owner = system_program::ID
    )]
    pub fee_escrow: AccountInfo<'info>,

    #[account(mut)]
    pub asset: Signer<'info>,

    // NOTE: do not add anything above this to keep indexing working
    #[account(
        seeds = [b"config".as_ref()],
        bump,
    )]
    pub config: Account<'info, BlipConfig>,

    /// CHECK: account
    #[account(mut)]
    pub collection: UncheckedAccount<'info>,
    pub collection_authority: Signer<'info>,

    /// CHECK: account checked in CPI
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}
