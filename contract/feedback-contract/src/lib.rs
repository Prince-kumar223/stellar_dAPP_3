#![no_std]
use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String,
};
use user_registry_contract::UserRegistryContractClient;

#[contracttype]
pub enum DataKey {
    Admin,
    FeedbackCount,
    Feedback(u32),
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum Status {
    Pending,
    Reviewed,
    Resolved,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Feedback {
    pub id: u32,
    pub author: Address,
    pub message: String,
    pub status: Status,
    pub created_at: u64,
    pub reviewed_at: Option<u64>,
    pub resolved_at: Option<u64>,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum FeedbackError {
    NotAdmin = 1,
    NotRegistered = 2,
    FeedbackNotFound = 3,
    InvalidStatusTransition = 4,
    EmptyMessage = 5,
    AlreadyInitialized = 6,
}

#[contractevent(topics = ["FeedbackCreated"])]
pub struct FeedbackCreated {
    #[topic]
    pub id: u32,
    #[topic]
    pub author: Address,
    pub status: Status,
    pub timestamp: u64,
}

#[contractevent(topics = ["FeedbackReviewed"])]
pub struct FeedbackReviewed {
    #[topic]
    pub id: u32,
    #[topic]
    pub author: Address,
    pub admin: Address,
    pub status: Status,
    pub timestamp: u64,
}

#[contractevent(topics = ["FeedbackResolved"])]
pub struct FeedbackResolved {
    #[topic]
    pub id: u32,
    #[topic]
    pub author: Address,
    pub admin: Address,
    pub status: Status,
    pub timestamp: u64,
}

#[contract]
pub struct FeedbackContract;

#[contractimpl]
impl FeedbackContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), FeedbackError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(FeedbackError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn create_feedback(
        env: Env,
        author: Address,
        message: String,
        user_registry_contract: Address,
    ) -> Result<u32, FeedbackError> {
        if message.is_empty() {
            return Err(FeedbackError::EmptyMessage);
        }

        author.require_auth();

        let registry_client = UserRegistryContractClient::new(&env, &user_registry_contract);
        if !registry_client.is_registered(&author) {
            return Err(FeedbackError::NotRegistered);
        }

        let count_key = DataKey::FeedbackCount;
        let mut count: u32 = env.storage().instance().get(&count_key).unwrap_or(0);
        count += 1;

        let feedback = Feedback {
            id: count,
            author: author.clone(),
            message,
            status: Status::Pending,
            created_at: env.ledger().timestamp(),
            reviewed_at: None,
            resolved_at: None,
        };

        env.storage()
            .instance()
            .set(&DataKey::Feedback(count), &feedback);
        env.storage().instance().set(&count_key, &count);
        FeedbackCreated {
            id: count,
            author,
            status: Status::Pending,
            timestamp: feedback.created_at,
        }
        .publish(&env);

        Ok(count)
    }

    pub fn get_feedback(env: Env, id: u32) -> Result<Feedback, FeedbackError> {
        env.storage()
            .instance()
            .get(&DataKey::Feedback(id))
            .ok_or(FeedbackError::FeedbackNotFound)
    }

    pub fn review_feedback(env: Env, id: u32) -> Result<(), FeedbackError> {
        let admin = require_admin(&env)?;

        let mut feedback = get_existing_feedback(&env, id)?;
        if feedback.status != Status::Pending {
            return Err(FeedbackError::InvalidStatusTransition);
        }

        let timestamp = env.ledger().timestamp();
        feedback.status = Status::Reviewed;
        feedback.reviewed_at = Some(timestamp);

        env.storage()
            .instance()
            .set(&DataKey::Feedback(id), &feedback);
        FeedbackReviewed {
            id,
            author: feedback.author,
            admin,
            status: Status::Reviewed,
            timestamp,
        }
        .publish(&env);

        Ok(())
    }

    pub fn resolve_feedback(env: Env, id: u32) -> Result<(), FeedbackError> {
        let admin = require_admin(&env)?;

        let mut feedback = get_existing_feedback(&env, id)?;
        if feedback.status != Status::Reviewed {
            return Err(FeedbackError::InvalidStatusTransition);
        }

        let timestamp = env.ledger().timestamp();
        feedback.status = Status::Resolved;
        feedback.resolved_at = Some(timestamp);

        env.storage()
            .instance()
            .set(&DataKey::Feedback(id), &feedback);
        FeedbackResolved {
            id,
            author: feedback.author,
            admin,
            status: Status::Resolved,
            timestamp,
        }
        .publish(&env);

        Ok(())
    }
}

fn require_admin(env: &Env) -> Result<Address, FeedbackError> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(FeedbackError::NotAdmin)?;

    admin.require_auth();
    Ok(admin)
}

fn get_existing_feedback(env: &Env, id: u32) -> Result<Feedback, FeedbackError> {
    env.storage()
        .instance()
        .get(&DataKey::Feedback(id))
        .ok_or(FeedbackError::FeedbackNotFound)
}

mod test;
