use anchor_lang::prelude::*;

#[error_code]
pub enum BlipRadarError {
  #[msg("Invalid Authority")]
  InvalidAuthority,
  #[msg("Invalid Fee Destination")]
  InvalidFeeDestination,
}
