#![cfg(test)]

extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events, Ledger},
    Env, Event,
};

fn setup() -> (Env, UserRegistryContractClient<'static>, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register(UserRegistryContract, ());
    let client = UserRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    (env, client, admin, user)
}

#[test]
fn test_initialize_admin() {
    let (_env, client, admin, _user) = setup();

    client.initialize(&admin);

    assert!(!client.is_registered(&admin));
}

#[test]
fn test_prevent_double_initialization() {
    let (_env, client, admin, _user) = setup();
    let next_admin = Address::generate(&_env);

    client.initialize(&admin);

    let result = client.try_initialize(&next_admin);
    assert_eq!(result, Err(Ok(RegistryError::AlreadyInitialized)));
}

#[test]
fn test_register_user() {
    let (_env, client, admin, user) = setup();

    client.initialize(&admin);
    client.register_user(&user);

    assert!(client.is_registered(&user));
}

#[test]
fn test_unregister_user() {
    let (_env, client, admin, user) = setup();

    client.initialize(&admin);
    client.register_user(&user);
    client.unregister_user(&user);

    assert!(!client.is_registered(&user));
}

#[test]
fn test_verify_registered_user() {
    let (_env, client, admin, user) = setup();

    client.initialize(&admin);
    client.register_user(&user);

    assert_eq!(client.is_registered(&user), true);
}

#[test]
fn test_verify_unregistered_user() {
    let (_env, client, admin, user) = setup();

    client.initialize(&admin);

    assert_eq!(client.is_registered(&user), false);
}

#[test]
fn test_authorization_checks() {
    let env = Env::default();
    let contract_id = env.register(UserRegistryContract, ());
    let client = UserRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);

    let register_result = client.try_register_user(&user);
    assert!(register_result.is_err());

    env.mock_all_auths();
    client.register_user(&user);

    let second_user = Address::generate(&env);
    client.register_user(&second_user);

    drop(env);
}

#[test]
fn test_register_requires_initialized_admin() {
    let (_env, client, _admin, user) = setup();

    let result = client.try_register_user(&user);

    assert_eq!(result, Err(Ok(RegistryError::NotAdmin)));
}

#[test]
fn test_duplicate_register_and_missing_unregister_errors() {
    let (_env, client, admin, user) = setup();

    client.initialize(&admin);
    client.register_user(&user);

    let duplicate = client.try_register_user(&user);
    assert_eq!(duplicate, Err(Ok(RegistryError::UserAlreadyRegistered)));

    client.unregister_user(&user);

    let missing = client.try_unregister_user(&user);
    assert_eq!(missing, Err(Ok(RegistryError::UserNotRegistered)));
}

#[test]
fn test_registry_events_include_admin_and_timestamp() {
    let env = Env::default();
    env.ledger().with_mut(|ledger| ledger.timestamp = 42);
    env.mock_all_auths();

    let contract_id = env.register(UserRegistryContract, ());
    let client = UserRegistryContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);

    client.initialize(&admin);
    client.register_user(&user);
    let registered = UserRegistered {
        user: user.clone(),
        admin: admin.clone(),
        timestamp: 42,
    };
    assert_eq!(
        env.events().all().filter_by_contract(&contract_id),
        std::vec![registered.to_xdr(&env, &contract_id)]
    );

    client.unregister_user(&user);
    let unregistered = UserUnregistered {
        user,
        admin,
        timestamp: 42,
    };
    assert_eq!(
        env.events().all().filter_by_contract(&contract_id),
        std::vec![unregistered.to_xdr(&env, &contract_id)]
    );
}
