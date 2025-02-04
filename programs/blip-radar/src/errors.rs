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

  #[msg("No fee share recipients")]
  NoFeeShareRecipients,
  #[msg("Fee share recipient not writable")]
  FeeShareRecipientNotWritable,
  #[msg("Invalid fee share recipient")]
  InvalidFeeShareRecipient,
  #[msg("Calculation error")]
  CalculationError,
}
