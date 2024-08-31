use anchor_lang::prelude::*;

#[error_code]
pub enum BlipRadarError {
  #[msg("Invalid Fee Destination")]
  InvalidFeeDestination,
}
