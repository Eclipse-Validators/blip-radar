use anchor_lang::prelude::*;

declare_id!("BvD8LJS8jmoRoGchwvJs5hbJhdMAYg8hcA4H7wr4jBdy");

#[program]
pub mod blip_radar {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
