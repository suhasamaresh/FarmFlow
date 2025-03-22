use anchor_lang::prelude::*;

declare_id!("6dqYYEBGfD6JdnYYYUekhd5QPKJPQYHmBA3RASMuBb6o");
pub mod error;
pub mod participant;
pub mod produce;
pub mod payment;
pub mod dispute;
pub mod governance;
use error::*;
use participant::*;
use produce::*;
use payment::*;
use dispute::*;
use governance::*;

#[program]
pub mod decentralized_ag_supply {
    use super::*;
    
    pub fn register_participant(
        ctx: Context<RegisterParticipant>,
        role: ParticipantRole,
        name: String,
        contact_info: String,
    ) -> Result<()> {
        participant::register_participant(ctx, role, name, contact_info)
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
        produce::log_harvest(
            ctx,
            produce_id,
            produce_type,
            quantity,
            harvest_date,
            quality,
            qr_code_uri,
            farmer_price,
            transporter_fee,
        )
    }
    
    pub fn record_pickup(ctx: Context<RecordPickup>, temperature: i16, humidity: u8) -> Result<()> {
        produce::record_pickup(ctx, temperature, humidity)
    }
    
    pub fn confirm_pickup(ctx: Context<ConfirmPickup>) -> Result<()> {
        produce::confirm_pickup(ctx)
    }
    
    pub fn record_delivery(ctx: Context<RecordDelivery>) -> Result<()> {
        produce::record_delivery(ctx)
    }
    
    pub fn confirm_delivery(mut ctx: Context<ConfirmDelivery>) -> Result<()> {
        let mut bumps_map: std::collections::BTreeMap<String, u8> = std::collections::BTreeMap::new();
        bumps_map.insert("produce".to_string(), ctx.bumps.produce);
        bumps_map.insert("retailer_account".to_string(), ctx.bumps.retailer_account);
        bumps_map.insert("payment_vault".to_string(), ctx.bumps.payment_vault);
        
        // Process status update and payments in one function
        produce::confirm_delivery(&mut ctx.accounts, &bumps_map)?;
        
        Ok(())
    }
    
    pub fn verify_quality(ctx: Context<VerifyQuality>, verified_quality: u8) -> Result<()> {
        produce::verify_quality(ctx, verified_quality)
    }
    
    pub fn initialize_vault(ctx: Context<InitializeVault>) -> Result<()> {
        payment::initialize_vault(ctx)
    }
    
    pub fn fund_vault(ctx: Context<FundVault>, amount: u64) -> Result<()> {
        payment::fund_vault(ctx, amount)
    }
    
    pub fn process_payment(ctx: Context<ProcessPayment>) -> Result<()> {
        payment::process_payment(ctx)
    }
    
    pub fn raise_dispute(ctx: Context<RaiseDispute>, description: String) -> Result<()> {
        dispute::raise_dispute(ctx, description)
    }
    
    pub fn resolve_dispute(ctx: Context<ResolveDispute>, resolution: bool) -> Result<()> {
        dispute::resolve_dispute(ctx, resolution)
    }
    
    pub fn stake_tokens(ctx: Context<StakeTokens>, amount: u64) -> Result<()> {
        payment::stake_tokens(ctx, amount)
    }
    
    pub fn unstake_tokens(ctx: Context<UnstakeTokens>, amount: u64) -> Result<()> {
        payment::unstake_tokens(ctx, amount)
    }
    
    pub fn create_proposal(
        ctx: Context<CreateProposal>,
        proposal_id: u64,
        description: String,
    ) -> Result<()> {
        governance::create_proposal(ctx, proposal_id, description)
    }
    
    pub fn vote_proposal(
        ctx: Context<VoteProposal>,
        proposal_id: u64,
        vote_for: bool,
    ) -> Result<()> {
        governance::vote_proposal(ctx, proposal_id, vote_for)
    }
    
    pub fn execute_proposal(ctx: Context<ExecuteProposal>, proposal_id: u64) -> Result<()> {
        governance::execute_proposal(ctx, proposal_id)
    }
}