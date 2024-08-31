use anchor_lang::prelude::*;

use instructions::*;

pub mod constants;
pub mod errors;
pub mod instructions;

declare_id!("rdrXzA9XiyvxrBdd6AweQPQHRw2hYTGdUb43rUPaerS");

#[program]
pub mod blip_radar {
    use super::*;


    pub fn send_blip(ctx: Context<SendBlip>, asset_json_uri: String) -> Result<()> {
        instructions::send_blip(ctx, asset_json_uri)
    }
}

#[derive(Accounts)]
pub struct Initialize {}
