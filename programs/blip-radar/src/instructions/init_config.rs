use anchor_lang::prelude::*;

use crate::constants::AUTHORITY;
use crate::errors::BlipRadarError;
use crate::state::{BlipConfig, FeeShare};

pub fn init_config(
    ctx: Context<InitConfig>,
    fee_lamports: u64,
    fee_shares: Vec<FeeShare>,
) -> Result<()> {
    require!(
        fee_shares.len() <= BlipConfig::MAX_FEE_SHARES,
        BlipRadarError::TooManyFeeShares
    );

    // total fee share basis points cannot exceed 10_000 (100%)
    let total_basis_points: u16 = fee_shares.iter().map(|share| share.basis_points).sum();
    require!(
        total_basis_points <= 10_000,
        BlipRadarError::InvalidFeeBasisPoints
    );

    let config = &mut ctx.accounts.config;
    config.fee_lamports = fee_lamports;
    config.fee_shares = fee_shares;

    Ok(())
}

#[derive(Accounts)]
pub struct InitConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        constraint = authority.key() == AUTHORITY @ BlipRadarError::IncorrectAuthority,
        seeds = [b"config".as_ref()],
        bump,
        payer = authority,
        space = BlipConfig::ACCOUNT_SIZE,
    )]
    pub config: Account<'info, BlipConfig>,

    pub system_program: Program<'info, System>,
}
