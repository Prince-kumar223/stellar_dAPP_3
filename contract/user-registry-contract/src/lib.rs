#![no_std]

use soroban_sdk::{contract, contracterror, contractevent, contractimpl, contracttype, Address, Env};

#[contracttype]
pub enum DataKey {
    Admin,
    RegisteredUser(Address),
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum RegistryError {
    NotAdmin = 1,
    AlreadyInitialized = 2,
    UserAlreadyRegistered = 3,
    UserNotRegistered = 4,
}

#[contractevent(topics = ["UserRegistered"])]
pub struct UserRegistered {
    #[topic]
    pub user: Address,
}

#[contractevent(topics = ["UserUnregistered"])]
pub struct UserUnregistered {
    #[topic]
    pub user: Address,
}

#[contract]
pub struct UserRegistryContract;

#[contractimpl]
impl UserRegistryContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), RegistryError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(RegistryError::AlreadyInitialized);
        }

        env.storage().instance().set(&DataKey::Admin, &admin);
        Ok(())
    }

    pub fn register_user(env: Env, user: Address) -> Result<(), RegistryError> {
        require_admin(&env)?;

        let user_key = DataKey::RegisteredUser(user.clone());
        if env.storage().instance().has(&user_key) {
            return Err(RegistryError::UserAlreadyRegistered);
        }

        env.storage().instance().set(&user_key, &true);
        UserRegistered { user }.publish(&env);

        Ok(())
    }

    pub fn unregister_user(env: Env, user: Address) -> Result<(), RegistryError> {
        require_admin(&env)?;

        let user_key = DataKey::RegisteredUser(user.clone());
        if !env.storage().instance().has(&user_key) {
            return Err(RegistryError::UserNotRegistered);
        }

        env.storage().instance().remove(&user_key);
        UserUnregistered { user }.publish(&env);

        Ok(())
    }

    pub fn is_registered(env: Env, user: Address) -> bool {
        env.storage()
            .instance()
            .get(&DataKey::RegisteredUser(user))
            .unwrap_or(false)
    }
}

fn require_admin(env: &Env) -> Result<Address, RegistryError> {
    let admin: Address = env
        .storage()
        .instance()
        .get(&DataKey::Admin)
        .ok_or(RegistryError::NotAdmin)?;

    admin.require_auth();
    Ok(admin)
}

mod test;
