use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy)]
pub struct FeeShare {
    pub basis_points: u16,                // 2
    pub destination: Pubkey,              // 32
}

impl FeeShare {
    pub const ACCOUNT_SIZE: usize = 2 + 32;
}

#[account]
pub struct BlipConfig {
    pub fee_lamports: u64,                // 8
    pub fee_shares: Vec<FeeShare>,        // 4 + 32 * 5
}

impl BlipConfig {
    pub const MAX_FEE_SHARES: usize = 5;

    pub const FEE_SHARE_SIZE: usize = (Self::MAX_FEE_SHARES * FeeShare::ACCOUNT_SIZE);
    pub const ACCOUNT_SIZE: usize = 8                          // discriminator
                                  + 8                          // fee_lamports
                                  + 4 + Self::FEE_SHARE_SIZE;  // fee_shares
}
