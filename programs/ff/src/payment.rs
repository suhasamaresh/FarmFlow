use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Mint};
use crate::error::ErrorCode;
use crate::produce::ProduceStatus;

pub const QUALITY_THRESHOLD_HIGH: u8 = 80;
pub const QUALITY_THRESHOLD_LOW: u8 = 50;
pub const TEMP_THRESHOLD: i16 = 30;
pub const HUMIDITY_THRESHOLD: u8 = 90;

#[account]
pub struct Vault {
    pub bump: u8,
}

pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
    let vault = &mut ctx.accounts.vault;
    vault.bump = ctx.bumps.vault;
    // No manual token::initialize_account needed; handled by Anchor's init
    Ok(())
}

pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
    let produce = &ctx.accounts.produce;
    let total_required = produce.farmer_price.saturating_add(produce.transporter_fee);
    require!(amount >= total_required, ErrorCode::InsufficientFunds);

    let cpi_accounts = Transfer {
        from: ctx.accounts.retailer_token_account.to_account_info(),
        to: ctx.accounts.payment_vault.to_account_info(),
        authority: ctx.accounts.retailer.to_account_info(),
    };
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
    )?;
    Ok(())
}

pub fn process_payment(ctx: Context<ProcessPayment>) -> Result<()> {
    let produce = &ctx.accounts.produce;
    require!(
        produce.delivery_confirmed && produce.status == ProduceStatus::Delivered,
        ErrorCode::InvalidStatus
    );

    let mut farmer_reward = produce.farmer_price;
    let mut transporter_reward = produce.transporter_fee;

    if produce.verified_quality >= QUALITY_THRESHOLD_HIGH {
        farmer_reward = farmer_reward.saturating_add(farmer_reward / 5); // +20%
        transporter_reward = transporter_reward.saturating_add(transporter_reward / 10); // +10%
    } else if produce.verified_quality < QUALITY_THRESHOLD_LOW && !produce.dispute_raised {
        farmer_reward = farmer_reward.saturating_sub(farmer_reward * 3 / 10); // -30%
        transporter_reward = transporter_reward.saturating_sub(transporter_reward * 15 / 100); // -15%
    }

    if produce.transport_temp != -999 && produce.transport_temp > TEMP_THRESHOLD {
        transporter_reward = transporter_reward.saturating_sub(transporter_reward / 5); // -20%
    }
    if produce.transport_humidity != 255 && produce.transport_humidity > HUMIDITY_THRESHOLD {
        transporter_reward = transporter_reward.saturating_sub(transporter_reward / 10); // -10%
    }

    if produce.dispute_raised {
        return Ok(()); // Payments deferred until dispute resolution
    }

    let min_reward = 10u64;
    farmer_reward = farmer_reward.max(min_reward);
    transporter_reward = transporter_reward.max(min_reward);

    // Get the vault PDA, which should be consistent with the one used during initialization
    let vault_bump = ctx.bumps.payment_vault;
    let bump_array = [vault_bump];
    let vault_seeds = &[b"vault".as_ref(), &bump_array][..];
    let signer = &[&vault_seeds[..]];

    let cpi_accounts_farmer = Transfer {
        from: ctx.accounts.payment_vault.to_account_info(),
        to: ctx.accounts.farmer_payment_account.to_account_info(),
        authority: ctx.accounts.payment_vault.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_farmer,
            signer,
        ),
        farmer_reward,
    )?;

    let cpi_accounts_transporter = Transfer {
        from: ctx.accounts.payment_vault.to_account_info(),
        to: ctx.accounts.transporter_payment_account.to_account_info(),
        authority: ctx.accounts.payment_vault.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_transporter,
            signer,
        ),
        transporter_reward,
    )?;

    Ok(())
}

// New function to process payments from ConfirmDelivery context
pub fn process_delivery_payment(ctx: Context<crate::produce::ConfirmDelivery>) -> Result<()> {
    let produce = &ctx.accounts.produce;
    require!(
        produce.delivery_confirmed && produce.status == ProduceStatus::Delivered,
        ErrorCode::InvalidStatus
    );

    let mut farmer_reward = produce.farmer_price;
    let mut transporter_reward = produce.transporter_fee;

    if produce.verified_quality >= QUALITY_THRESHOLD_HIGH {
        farmer_reward = farmer_reward.saturating_add(farmer_reward / 5); // +20%
        transporter_reward = transporter_reward.saturating_add(transporter_reward / 10); // +10%
    } else if produce.verified_quality < QUALITY_THRESHOLD_LOW && !produce.dispute_raised {
        farmer_reward = farmer_reward.saturating_sub(farmer_reward * 3 / 10); // -30%
        transporter_reward = transporter_reward.saturating_sub(transporter_reward * 15 / 100); // -15%
    }

    if produce.transport_temp != -999 && produce.transport_temp > TEMP_THRESHOLD {
        transporter_reward = transporter_reward.saturating_sub(transporter_reward / 5); // -20%
    }
    if produce.transport_humidity != 255 && produce.transport_humidity > HUMIDITY_THRESHOLD {
        transporter_reward = transporter_reward.saturating_sub(transporter_reward / 10); // -10%
    }

    if produce.dispute_raised {
        return Ok(()); // Payments deferred until dispute resolution
    }

    let min_reward = 10u64;
    farmer_reward = farmer_reward.max(min_reward);
    transporter_reward = transporter_reward.max(min_reward);

    // Use the vault bump from the context
    let vault_bump = ctx.bumps.vault;  // Use vault bump instead of payment_vault
    let bump_array = [vault_bump];
    let vault_seeds = &[b"vault".as_ref(), &bump_array][..];
    let signer = &[&vault_seeds[..]];

    // Transfer to farmer
    let cpi_accounts_farmer = Transfer {
        from: ctx.accounts.payment_vault.to_account_info(),
        to: ctx.accounts.farmer_payment_account.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),  // Use vault PDA as authority
    };
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_farmer,
            signer,
        ),
        farmer_reward,
    )?;

    // Transfer to transporter
    let cpi_accounts_transporter = Transfer {
        from: ctx.accounts.payment_vault.to_account_info(),
        to: ctx.accounts.transporter_payment_account.to_account_info(),
        authority: ctx.accounts.vault.to_account_info(),  // Use vault PDA as authority
    };
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts_transporter,
            signer,
        ),
        transporter_reward,
    )?;

    Ok(())
}

pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
    let cpi_accounts = Transfer {
        from: ctx.accounts.staker_token_account.to_account_info(),
        to: ctx.accounts.stake_vault.to_account_info(),
        authority: ctx.accounts.staker.to_account_info(),
    };
    token::transfer(
        CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts),
        amount,
    )?;
    Ok(())
}

pub fn unstake_tokens(ctx: Context<UnstakeTokens>, amount: u64) -> Result<()> {
    let vault_bump = ctx.bumps.stake_vault;
    let bump_array = [vault_bump];
    let vault_seeds = &[b"stake_vault".as_ref(), &bump_array][..];
    let signer = &[&vault_seeds[..]];

    let cpi_accounts = Transfer {
        from: ctx.accounts.stake_vault.to_account_info(),
        to: ctx.accounts.staker_token_account.to_account_info(),
        authority: ctx.accounts.stake_vault.to_account_info(),
    };
    token::transfer(
        CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            cpi_accounts,
            signer,
        ),
        amount,
    )?;
    Ok(())
}

#[derive(Accounts)]
pub struct InitializeVault<'info> {
    #[account(
        init,
        payer = authority,
        space = 8 + 1, // Discriminator + bump
        seeds = [b"vault"],
        bump
    )]
    pub vault: Account<'info, Vault>,
    #[account(
        init,
        payer = authority,
        token::mint = mint,
        token::authority = vault, // Vault PDA controls the token account
        seeds = [b"vault_token"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct FundVault<'info> {
    #[account(
        mut,
        seeds = [b"produce", &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, crate::produce::Produce>,
    #[account(mut)]
    pub retailer: Signer<'info>,
    #[account(mut)]
    pub retailer_token_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault_token"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>
}

#[derive(Accounts)]
pub struct ProcessPayment<'info> {
    #[account(
        mut,
        seeds = [b"produce", &produce.produce_id.to_le_bytes()[..]],
        bump
    )]
    pub produce: Account<'info, crate::produce::Produce>,
    #[account(mut)]
    pub farmer_payment_account: Account<'info, TokenAccount>,
    #[account(mut)]
    pub transporter_payment_account: Account<'info, TokenAccount>,
    #[account(
        mut,
        seeds = [b"vault_token"],
        bump
    )]
    pub payment_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct StakeTokens<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(mut)]
    pub staker_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"stake_vault"], bump)]
    pub stake_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UnstakeTokens<'info> {
    #[account(mut)]
    pub staker: Signer<'info>,
    #[account(mut)]
    pub staker_token_account: Account<'info, TokenAccount>,
    #[account(mut, seeds = [b"stake_vault"], bump)]
    pub stake_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}