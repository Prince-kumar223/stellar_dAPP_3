#![no_std]

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct UserRegistryContract;

#[contractimpl]
impl UserRegistryContract {
    pub fn is_registered(_env: Env, _user: Address) -> bool {
        false
    }
}
