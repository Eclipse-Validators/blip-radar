use anchor_lang::prelude::*;

#[error_code]
pub enum BlipRadarError {
  #[msg("Invalid Authority")]
  InvalidAuthority,
  #[msg("Invalid Fee Destination")]
  InvalidFeeDestination,

  #[msg("Too many fee shares")]
  TooManyFeeShares,
  #[msg("Invalid fee basis points")]
  InvalidFeeBasisPoints,
  #[msg("Incorrect Authority")]
  IncorrectAuthority,
}
