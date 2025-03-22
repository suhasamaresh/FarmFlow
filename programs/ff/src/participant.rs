use anchor_lang::prelude::*;

/// Defines the different participant roles.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ParticipantRole {
    Farmer,
    Transporter,
    Wholesaler,
    Retailer,
    Arbitrator, // For dispute resolution and governance
}

/// Participant account that stores identity details.
#[account]
pub struct Participant {
    pub owner: Pubkey,
    pub role: ParticipantRole,
    pub name: String,         // (max ~32 characters)
    pub contact_info: String, // (max ~64 characters)
    pub created_at: i64,
}

impl Participant {
    // Size: Increased to 256 bytes for buffer and safety (previously updated).
    pub const LEN: usize = 256;
}

/// Custom error codes for the program.
#[error_code]
pub enum ErrorCode {
    #[msg("Name exceeds maximum length of 32 characters")]
    NameTooLong,
    #[msg("Contact info exceeds maximum length of 64 characters")]
    ContactInfoTooLong,
}

/// Registers a participant.
pub fn register_participant(
    ctx: Context<RegisterParticipant>,
    role: ParticipantRole,
    name: String,
    contact_info: String
) -> Result<()> {
    // Validate string lengths
    if name.len() > 32 {
        return Err(ErrorCode::NameTooLong.into());
    }
    if contact_info.len() > 64 {
        return Err(ErrorCode::ContactInfoTooLong.into());
    }

    let participant = &mut ctx.accounts.participant;
    participant.owner = ctx.accounts.user.key();
    participant.role = role;
    participant.name = name;
    participant.contact_info = contact_info;
    participant.created_at = Clock::get()?.unix_timestamp;
    Ok(())
}

/// Context for participant registration.
#[derive(Accounts)]
pub struct RegisterParticipant<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + Participant::LEN, // 8 (discriminator) + 256 = 264 bytes
        seeds = [b"participant", user.key.as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
    #[account(mut)]
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}