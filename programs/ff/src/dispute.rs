use anchor_lang::prelude::*;
use crate::produce::{Produce, ProduceStatus};
use crate::error::ErrorCode;

#[account]
pub struct Dispute {
    pub produce: Pubkey,
    pub raiser: Pubkey,
    pub description: String, // (max ~128 characters)
    pub created_at: i64,
    pub resolved: bool,
    pub resolution: bool, // true if resolved in favor of the original terms
}

impl Dispute {
    // Size: produce (32) + raiser (32) + description (4+128) + created_at (8) + resolved (1) + resolution (1) = ~206, plus 8 = 214.
    pub const LEN: usize = 214;
}

#[event]
pub struct DisputeRaised {
    pub produce: Pubkey,
    pub raiser: Pubkey,
    pub timestamp: i64,
}

/// Raises a dispute for a produce batch.
pub fn raise_dispute(ctx: Context<RaiseDispute>, description: String) -> Result<()> {
    let dispute = &mut ctx.accounts.dispute;
    dispute.produce = ctx.accounts.produce.key();
    dispute.raiser = ctx.accounts.raiser.key();
    dispute.description = description;
    dispute.created_at = Clock::get()?.unix_timestamp;
    dispute.resolved = false;
    dispute.resolution = false;
    
    // Mark the produce as having a dispute.
    let produce = &mut ctx.accounts.produce;
    produce.dispute_raised = true;

    emit!(DisputeRaised {
        produce: produce.key(),
        raiser: ctx.accounts.raiser.key(),
        timestamp: dispute.created_at,
    });
    Ok(())
}

#[derive(Accounts)]
pub struct RaiseDispute<'info> {
    #[account(mut)]
    pub produce: Account<'info, Produce>,
    #[account(mut)]
    pub raiser: Signer<'info>,
    #[account(
        init,
        payer = raiser,
        space = 8 + Dispute::LEN,
        seeds = [b"dispute", produce.key().as_ref()],
        bump
    )]
    pub dispute: Account<'info, Dispute>,
    pub system_program: Program<'info, System>,
}

/// Resolves a dispute. The arbitrator (with proper role) decides the outcome.
pub fn resolve_dispute(ctx: Context<ResolveDispute>, resolution: bool) -> Result<()> {
    // Ensure the caller is an Arbitrator.
    let arbitrator_account = &ctx.accounts.arbitrator_account;
    if let crate::participant::ParticipantRole::Arbitrator = arbitrator_account.role {
        // OK.
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }
    
    let dispute = &mut ctx.accounts.dispute;
    require!(!dispute.resolved, ErrorCode::AlreadyResolved);
    dispute.resolved = true;
    dispute.resolution = resolution;
    
    // Update produce status based on the resolution.
    let produce = &mut ctx.accounts.produce;
    produce.dispute_raised = false;
    if resolution {
        // Resolved in favor of original terms.
        produce.status = ProduceStatus::Delivered;
    } else {
        // Dispute stands; mark as disputed.
        produce.status = ProduceStatus::Disputed;
    }
    Ok(())
}

#[derive(Accounts)]
pub struct ResolveDispute<'info> {
    #[account(mut)]
    pub dispute: Account<'info, Dispute>,
    #[account(mut)]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [b"participant", arbitrator.key.as_ref()],
        bump,
        constraint = arbitrator_account.owner == arbitrator.key()
    )]
    pub arbitrator_account: Account<'info, crate::participant::Participant>,
    pub arbitrator: Signer<'info>,
}
