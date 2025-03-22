use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Invalid produce status for this operation.")]
    InvalidStatus,
    #[msg("Unauthorized action.")]
    Unauthorized,
    #[msg("Arithmetic overflow occurred.")]
    Overflow,
    #[msg("Dispute already resolved.")]
    AlreadyResolved,
    #[msg("Proposal already executed.")]
    AlreadyExecuted,
    #[msg("Missing bump.")]
    MissingBump,
    #[msg("Not sufficient funds")]
    InsufficientFunds,
    #[msg("Vote is already casted")]
    AlreadyVoted,
}
