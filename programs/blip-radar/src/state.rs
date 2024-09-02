use anchor_lang::prelude::*;

#[account]
pub struct BlipCounter {
    pub count: u64,
}