use anchor_lang::prelude::*;
use crate::error::ErrorCode;
use crate::participant::Participant;
use std::collections::BTreeMap;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

/// Different states of a produce batch.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum ProduceStatus {
    Harvested,
    PickedUp,
    InTransit,
    Delivered,
    QualityVerified,
    Disputed,
}

/// The Produce account tracks a batch from harvest to market.
#[account]
pub struct Produce {
    pub produce_id: u64,
    pub farmer: Pubkey,
    pub produce_type: String,
    pub quantity: u64,
    pub harvest_date: i64,
    pub quality: u8,
    pub status: ProduceStatus,
    pub last_updated: i64,
    pub transport_temp: i16,
    pub transport_humidity: u8,
    pub pickup_confirmed: bool,
    pub delivery_confirmed: bool,
    pub dispute_raised: bool,
    pub verified_quality: u8,
    pub qr_code_uri: String,
    pub farmer_price: u64,
    pub transporter_fee: u64,
}

impl Produce {
    pub const LEN: usize = 265;
}

#[event]
pub struct HarvestLogged {
    pub produce_id: u64,
    pub farmer: Pubkey,
    pub timestamp: i64,
}

pub fn log_harvest(
    ctx: Context<LogHarvest>,
    produce_id: u64,
    produce_type: String,
    quantity: u64,
    harvest_date: i64,
    quality: u8,
    qr_code_uri: String,
    farmer_price: u64,
    transporter_fee: u64,
) -> Result<()> {
    let farmer_account = &ctx.accounts.farmer_account;
    if let crate::participant::ParticipantRole::Farmer = farmer_account.role {
        // OK.
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }

    let produce = &mut ctx.accounts.produce;
    produce.produce_id = produce_id;
    produce.farmer = ctx.accounts.farmer.key();
    produce.produce_type = produce_type;
    produce.quantity = quantity;
    produce.harvest_date = harvest_date;
    produce.quality = quality;
    produce.verified_quality = quality;
    produce.status = ProduceStatus::Harvested;
    produce.last_updated = Clock::get()?.unix_timestamp;
    produce.transport_temp = -999;
    produce.transport_humidity = 255;
    produce.pickup_confirmed = false;
    produce.delivery_confirmed = false;
    produce.dispute_raised = false;
    produce.qr_code_uri = qr_code_uri;
    produce.farmer_price = farmer_price;
    produce.transporter_fee = transporter_fee;

    emit!(HarvestLogged {
        produce_id,
        farmer: ctx.accounts.farmer.key(),
        timestamp: produce.last_updated,
    });
    Ok(())
}

#[derive(Accounts)]
#[instruction(produce_id: u64)]
pub struct LogHarvest<'info> {
    #[account(
        init,
        payer = farmer,
        space = 8 + Produce::LEN,
        seeds = [&b"produce"[..], &produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], farmer.key.as_ref()],
        bump,
        constraint = farmer_account.owner == farmer.key()
    )]
    pub farmer_account: Account<'info, Participant>,
    #[account(mut)]
    pub farmer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn record_pickup(ctx: Context<RecordPickup>, temperature: i16, humidity: u8) -> Result<()> {
    let transporter_account = &ctx.accounts.transporter_account;
    if let crate::participant::ParticipantRole::Transporter = transporter_account.role {
        // OK.
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }

    let produce = &mut ctx.accounts.produce;
    require!(
        produce.status == ProduceStatus::Harvested,
        ErrorCode::InvalidStatus
    );
    produce.status = ProduceStatus::PickedUp;
    produce.last_updated = Clock::get()?.unix_timestamp;
    produce.transport_temp = temperature;
    produce.transport_humidity = humidity;
    Ok(())
}

#[derive(Accounts)]
pub struct RecordPickup<'info> {
    #[account(
        mut,
        seeds = [&b"produce"[..], &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], transporter.key.as_ref()],
        bump,
        constraint = transporter_account.owner == transporter.key()
    )]
    pub transporter_account: Account<'info, Participant>,
    pub transporter: Signer<'info>,
}

pub fn confirm_pickup(ctx: Context<ConfirmPickup>) -> Result<()> {
    let produce = &mut ctx.accounts.produce;
    require!(
        produce.status == ProduceStatus::PickedUp,
        ErrorCode::InvalidStatus
    );
    produce.pickup_confirmed = true;
    produce.last_updated = Clock::get()?.unix_timestamp;
    Ok(())
}

#[derive(Accounts)]
pub struct ConfirmPickup<'info> {
    #[account(
        mut,
        seeds = [&b"produce"[..], &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], farmer.key.as_ref()],
        bump,
        constraint = farmer_account.owner == farmer.key()
    )]
    pub farmer_account: Account<'info, Participant>,
    pub farmer: Signer<'info>,
}

pub fn record_delivery(ctx: Context<RecordDelivery>) -> Result<()> {
    let produce = &mut ctx.accounts.produce;
    require!(
        produce.status == ProduceStatus::PickedUp,
        ErrorCode::InvalidStatus
    );
    produce.status = ProduceStatus::InTransit;
    produce.last_updated = Clock::get()?.unix_timestamp;
    Ok(())
}

#[derive(Accounts)]
pub struct RecordDelivery<'info> {
    #[account(
        mut,
        seeds = [&b"produce"[..], &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], transporter.key.as_ref()],
        bump,
        constraint = transporter_account.owner == transporter.key()
    )]
    pub transporter_account: Account<'info, Participant>,
    pub transporter: Signer<'info>,
}

pub fn confirm_delivery(
    accounts: &mut ConfirmDelivery,
    _bumps: &BTreeMap<String, u8>,
) -> Result<()> {
    let retailer_account = &accounts.retailer_account;
    if let crate::participant::ParticipantRole::Retailer = retailer_account.role {
        // OK.
    } else {
        return Err(ErrorCode::Unauthorized.into());
    }
    let produce = &mut accounts.produce;
    require!(
        produce.status == ProduceStatus::InTransit,
        ErrorCode::InvalidStatus
    );

    // Update produce status
    produce.status = ProduceStatus::Delivered;
    produce.delivery_confirmed = true;
    produce.last_updated = Clock::get()?.unix_timestamp;

    // Process payments
    let farmer_reward = produce.farmer_price; // 1 lamport
    let transporter_reward = produce.transporter_fee; // 1 lamport
    let total_amount = farmer_reward + transporter_reward;

    msg!("Vault balance before transfer: {}", accounts.payment_vault.amount);
    msg!("Transferring to farmer: {} lamports", farmer_reward);
    msg!("Transferring to transporter: {} lamports", transporter_reward);

    // Check vault balance
    if accounts.payment_vault.amount < total_amount {
        msg!("Insufficient funds in vault: {} < {}", accounts.payment_vault.amount, total_amount);
        return Err(ErrorCode::InsufficientFunds.into());
    }

    // Vault signer seeds with a let binding to extend lifetime
    let vault_bump = accounts.vault.bump;
    let bump_array = [vault_bump]; // Named binding to persist beyond this line
    let vault_seeds = &[b"vault".as_ref(), &bump_array][..];
    let signer = &[vault_seeds];

    // Transfer to farmer
    let cpi_accounts_farmer = Transfer {
        from: accounts.payment_vault.to_account_info(),
        to: accounts.farmer_payment_account.to_account_info(),
        authority: accounts.vault.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(
            accounts.token_program.to_account_info(),
            cpi_accounts_farmer,
            signer,
        ),
        farmer_reward,
    )?;

    // Transfer to transporter
    let cpi_accounts_transporter = Transfer {
        from: accounts.payment_vault.to_account_info(),
        to: accounts.transporter_payment_account.to_account_info(),
        authority: accounts.vault.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(
            accounts.token_program.to_account_info(),
            cpi_accounts_transporter,
            signer,
        ),
        transporter_reward,
    )?;

    msg!("Payments processed successfully");
    Ok(())
}

#[derive(Accounts)]
pub struct ConfirmDelivery<'info> {
    #[account(
        mut,
        seeds = [&b"produce"[..], &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], retailer.key.as_ref()],
        bump,
        constraint = retailer_account.owner == retailer.key()
    )]
    pub retailer_account: Account<'info, Participant>,
    pub retailer: Signer<'info>,
    #[account(seeds = [b"vault"], bump)]
    pub vault: Account<'info, crate::payment::Vault>,
    #[account(mut, seeds = [&b"vault_token"[..]], bump)]
    pub payment_vault: Account<'info, TokenAccount>,
    #[account(mut)]
    pub farmer_payment_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub transporter_payment_account: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

pub fn verify_quality(ctx: Context<VerifyQuality>, verified_quality: u8) -> Result<()> {
    let verifier_account = &ctx.accounts.verifier_account;
    match verifier_account.role {
        crate::participant::ParticipantRole::Wholesaler
        | crate::participant::ParticipantRole::Retailer => {}
        _ => return Err(ErrorCode::Unauthorized.into()),
    }
    let produce = &mut ctx.accounts.produce;
    produce.verified_quality = verified_quality;
    produce.last_updated = Clock::get()?.unix_timestamp;
    if verified_quality < 50 {
        produce.status = ProduceStatus::Disputed;
        produce.dispute_raised = true;
    } else {
        produce.status = ProduceStatus::QualityVerified;
    }
    Ok(())
}

#[derive(Accounts)]
pub struct VerifyQuality<'info> {
    #[account(
        mut,
        seeds = [&b"produce"[..], &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, Produce>,
    #[account(
        mut,
        seeds = [&b"participant"[..], verifier.key.as_ref()],
        bump,
        constraint = verifier_account.owner == verifier.key()
    )]
    pub verifier_account: Account<'info, Participant>,
    pub verifier: Signer<'info>,
}