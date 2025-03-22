use anchor_lang::prelude::*;
use crate::error::ErrorCode;

#[account]
pub struct GovernanceProposal {
    pub proposal_id: u64,
    pub description: String,
    pub votes_for: u64,
    pub votes_against: u64,
    pub executed: bool,
    pub created_at: i64,
    pub voters: Vec<Pubkey>, // Add this
}

impl GovernanceProposal {
    // Size: proposal_id (8) + description (4+128) + votes_for (8) + votes_against (8) + executed (1) + created_at (8) = ~165, plus 8 = 173.
    pub const LEN: usize = 1024;
}

#[event]
pub struct ProposalCreated {
    pub proposal_id: u64,
    pub description: String,
    pub timestamp: i64,
}

/// Creates a new governance proposal.
pub fn create_proposal(ctx: Context<CreateProposal>, proposal_id: u64, description: String) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    proposal.proposal_id = proposal_id;
    proposal.description = description;
    proposal.votes_for = 0;
    proposal.votes_against = 0;
    proposal.executed = false;
    proposal.created_at = Clock::get()?.unix_timestamp;

    emit!(ProposalCreated {
        proposal_id,
        description: proposal.description.clone(),
        timestamp: proposal.created_at,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(proposal_id: u64)]
pub struct CreateProposal<'info> {
    #[account(
        init,
        payer = proposer,
        space = 8 + GovernanceProposal::LEN,
        seeds = [b"proposal", &proposal_id.to_le_bytes()],
        bump
    )]
    pub proposal: Account<'info, GovernanceProposal>,
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

/// Votes on a proposal.
pub fn vote_proposal(ctx: Context<VoteProposal>, _proposal_id: u64, vote_for: bool) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    let voter = ctx.accounts.voter.key();
    require!(!proposal.voters.contains(&voter), ErrorCode::AlreadyVoted);
    if vote_for {
        proposal.votes_for = proposal.votes_for.checked_add(1).ok_or(ErrorCode::Overflow)?;
    } else {
        proposal.votes_against = proposal.votes_against.checked_add(1).ok_or(ErrorCode::Overflow)?;
    }
    proposal.voters.push(voter);
    Ok(())
}

#[derive(Accounts)]
pub struct VoteProposal<'info> {
    #[account(mut, seeds = [b"proposal", &proposal.proposal_id.to_le_bytes()], bump)]
    pub proposal: Account<'info, GovernanceProposal>,
    #[account(mut)]
    pub voter: Signer<'info>,
}

/// Executes a proposal if conditions are met.
pub fn execute_proposal(ctx: Context<ExecuteProposal>, _proposal_id: u64) -> Result<()> {
    let proposal = &mut ctx.accounts.proposal;
    require!(!proposal.executed, ErrorCode::AlreadyExecuted);
    proposal.executed = true;
    Ok(())
}

#[derive(Accounts)]
pub struct ExecuteProposal<'info> {
    #[account(mut, seeds = [b"proposal", &proposal.proposal_id.to_le_bytes()], bump)]
    pub proposal: Account<'info, GovernanceProposal>,
    #[account(mut)]
    pub executor: Signer<'info>,
}
