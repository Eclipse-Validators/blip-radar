use anchor_lang::prelude::*;

use instructions::*;
use state::FeeShare;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("rdr1DeFWkwG6nQfammDLTzRT6uW32t7yEHWCmcr49Df");

#[program]
pub mod blip_radar {
    use super::*;

    pub fn init_config(
        ctx: Context<InitConfig>,
        fee_lamports: u64,
        fee_shares: Vec<FeeShare>,
    ) -> Result<()> {
        instructions::init_config(ctx, fee_lamports, fee_shares)
    }

    pub fn send_blip(ctx: Context<SendBlip>, asset_json_uri: String) -> Result<()> {
        instructions::send_blip(ctx, asset_json_uri)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
