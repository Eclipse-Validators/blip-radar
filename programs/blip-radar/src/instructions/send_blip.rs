use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use mpl_core::instructions::CreateV2CpiBuilder;

use crate::constants::{AUTHORITY, FEE_DESTINATION};
use crate::errors::BlipRadarError;
use crate::state::BlipCounter;

const BLIP_FEE_AMOUNT: u64 = 1_000_000;

pub fn send_blip(ctx: Context<SendBlip>, asset_json_uri: String) -> Result<()> {
    let asset_account = &ctx.accounts.asset;
    let payer_account = &ctx.accounts.payer;
    let fee_destination_account = &ctx.accounts.fee_destination;
    let receiver_account = &ctx.accounts.receiver;
    let collection_account = &ctx.accounts.collection;
    let collection_authority_account = &ctx.accounts.collection_authority;
    let mpl_core_program = &ctx.accounts.mpl_core_program;
    let system_program = &ctx.accounts.system_program;
    let blip_counter = &mut ctx.accounts.blip_counter;

    require_keys_eq!(
        fee_destination_account.key(),
        FEE_DESTINATION,
        BlipRadarError::InvalidFeeDestination
    );

    require_keys_eq!(
        collection_authority_account.key(),
        AUTHORITY,
        BlipRadarError::InvalidAuthority
    );

    transfer(
        CpiContext::new(
            system_program.to_account_info(),
            Transfer {
                from: payer_account.to_account_info(),
                to: fee_destination_account.to_account_info(),
            },
        ),
        BLIP_FEE_AMOUNT,
    )?;

    msg!("transfer Blip fee to {}", fee_destination_account.key());

    CreateV2CpiBuilder::new(mpl_core_program)
        .asset(asset_account)
        .collection(Some(collection_account))
        .authority(Some(collection_authority_account))
        .payer(payer_account)
        .owner(Some(receiver_account))
        .update_authority(None)
        .system_program(system_program)
        .name("Blip".to_string())
        .uri(asset_json_uri)
        .invoke()?;

    blip_counter.count += 1;

    Ok(())
}

#[derive(Accounts)]
#[instruction(asset_json_uri: String)]
pub struct SendBlip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub receiver: SystemAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 8, // 8 bytes for discriminator + 8 bytes for count
        seeds = [b"blip_counter", payer.key().as_ref()],
        bump
    )]
    pub blip_counter: Account<'info, BlipCounter>,

    #[account(mut)]
    pub fee_destination: SystemAccount<'info>,

    #[account(mut)]
    pub asset: Signer<'info>,

    /// CHECK: account
    #[account(mut)]
    pub collection: UncheckedAccount<'info>,
    pub collection_authority: Signer<'info>,

    /// CHECK: account checked in CPI
    #[account(address = mpl_core::ID)]
    pub mpl_core_program: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
}

