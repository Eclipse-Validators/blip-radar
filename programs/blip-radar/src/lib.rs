use anchor_lang::prelude::*;

declare_id!("rdrXzA9XiyvxrBdd6AweQPQHRw2hYTGdUb43rUPaerS");

#[program]
pub mod blip_radar {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
