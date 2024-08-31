use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::constants::FEE_DESTINATION;
use crate::errors::BlipRadarError;

const BLIP_FEE_AMOUNT: u64 = 1_000_000;

pub fn send_blip(ctx: Context<SendBlip>) -> Result<()> {
    let payer_account = &ctx.accounts.payer;
    let fee_destination_account = &ctx.accounts.fee_destination;
    let system_program = &ctx.accounts.system_program;

    require_keys_eq!(
        fee_destination_account.key(),
        FEE_DESTINATION,
        BlipRadarError::InvalidFeeDestination
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

    Ok(())
}

#[derive(Accounts)]
#[instruction()]
pub struct SendBlip<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(mut)]
    pub fee_destination: SystemAccount<'info>,

    pub system_program: Program<'info, System>,
}
