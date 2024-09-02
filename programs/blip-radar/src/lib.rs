use anchor_lang::prelude::*;

use instructions::*;

pub mod constants;
pub mod errors;
pub mod instructions;
pub mod state;

declare_id!("rdr1DeFWkwG6nQfammDLTzRT6uW32t7yEHWCmcr49Df");

#[program]
pub mod blip_radar {
    use super::*;


    pub fn send_blip(ctx: Context<SendBlip>, asset_json_uri: String) -> Result<()> {
        instructions::send_blip(ctx, asset_json_uri)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
