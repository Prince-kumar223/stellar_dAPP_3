#![cfg(test)]

extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, Events, Ledger, MockAuth, MockAuthInvoke},
    Env, Event, IntoVal, String,
};
use user_registry_contract::{UserRegistryContract, UserRegistryContractClient};

fn setup() -> (
    Env,
    FeedbackContractClient<'static>,
    UserRegistryContractClient<'static>,
    Address,
    Address,
    Address,
) {
    let env = Env::default();
    env.ledger()
        .with_mut(|ledger| ledger.timestamp = 1_700_000_000);
    env.mock_all_auths();

    let feedback_contract_id = env.register(FeedbackContract, ());
    let feedback_client = FeedbackContractClient::new(&env, &feedback_contract_id);

    let registry_contract_id = env.register(UserRegistryContract, ());
    let registry_client = UserRegistryContractClient::new(&env, &registry_contract_id);

    let admin = Address::generate(&env);
    let registered_user = Address::generate(&env);

    registry_client.initialize(&admin);
    registry_client.register_user(&registered_user);
    feedback_client.initialize(&admin);

    (
        env,
        feedback_client,
        registry_client,
        registry_contract_id,
        admin,
        registered_user,
    )
}

#[test]
fn test_initialize_admin() {
    let env = Env::default();
    env.mock_all_auths();
    let contract_id = env.register(FeedbackContract, ());
    let client = FeedbackContractClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);

    let result = client.try_initialize(&admin);
    assert_eq!(result, Err(Ok(FeedbackError::AlreadyInitialized)));
}

#[test]
fn test_registered_user_feedback_creation() {
    let (env, feedback_client, _registry_client, registry_id, _admin, registered_user) = setup();
    let message = String::from_str(&env, "The app is useful.");

    let id = feedback_client.create_feedback(&registered_user, &message, &registry_id);
    let feedback = feedback_client.get_feedback(&id);

    assert_eq!(id, 1);
    assert_eq!(feedback.id, id);
    assert_eq!(feedback.author, registered_user);
    assert_eq!(feedback.message, message);
    assert_eq!(feedback.status, Status::Pending);
    assert_eq!(feedback.reviewed_at, None);
    assert_eq!(feedback.resolved_at, None);
}

#[test]
fn test_unregistered_user_rejection() {
    let (env, feedback_client, _registry_client, registry_id, _admin, _registered_user) = setup();
    let unregistered_user = Address::generate(&env);
    let message = String::from_str(&env, "I should not be accepted.");

    let result = feedback_client.try_create_feedback(&unregistered_user, &message, &registry_id);

    assert_eq!(result, Err(Ok(FeedbackError::NotRegistered)));
}

#[test]
fn test_review_feedback() {
    let (env, feedback_client, _registry_client, registry_id, _admin, registered_user) = setup();
    let message = String::from_str(&env, "Please review this.");

    let id = feedback_client.create_feedback(&registered_user, &message, &registry_id);
    feedback_client.review_feedback(&id);
    let feedback = feedback_client.get_feedback(&id);

    assert_eq!(feedback.status, Status::Reviewed);
    assert_eq!(feedback.reviewed_at, Some(1_700_000_000));
    assert_eq!(feedback.resolved_at, None);
}

#[test]
fn test_resolve_feedback() {
    let (env, feedback_client, _registry_client, registry_id, _admin, registered_user) = setup();
    let message = String::from_str(&env, "Resolve after review.");

    let id = feedback_client.create_feedback(&registered_user, &message, &registry_id);
    feedback_client.review_feedback(&id);
    feedback_client.resolve_feedback(&id);
    let feedback = feedback_client.get_feedback(&id);

    assert_eq!(feedback.status, Status::Resolved);
    assert_eq!(feedback.reviewed_at, Some(1_700_000_000));
    assert_eq!(feedback.resolved_at, Some(1_700_000_000));
}

#[test]
fn test_invalid_transition_rejection() {
    let (env, feedback_client, _registry_client, registry_id, _admin, registered_user) = setup();
    let message = String::from_str(&env, "Transition rules matter.");

    let id = feedback_client.create_feedback(&registered_user, &message, &registry_id);

    let pending_to_resolved = feedback_client.try_resolve_feedback(&id);
    assert_eq!(
        pending_to_resolved,
        Err(Ok(FeedbackError::InvalidStatusTransition))
    );

    feedback_client.review_feedback(&id);
    feedback_client.resolve_feedback(&id);

    let resolved_to_reviewed = feedback_client.try_review_feedback(&id);
    assert_eq!(
        resolved_to_reviewed,
        Err(Ok(FeedbackError::InvalidStatusTransition))
    );

    let resolved_to_resolved = feedback_client.try_resolve_feedback(&id);
    assert_eq!(
        resolved_to_resolved,
        Err(Ok(FeedbackError::InvalidStatusTransition))
    );
}

#[test]
fn test_feedback_not_found() {
    let (_env, feedback_client, _registry_client, _registry_id, _admin, _registered_user) = setup();

    let get_result = feedback_client.try_get_feedback(&999);
    assert_eq!(get_result, Err(Ok(FeedbackError::FeedbackNotFound)));

    let review_result = feedback_client.try_review_feedback(&999);
    assert_eq!(review_result, Err(Ok(FeedbackError::FeedbackNotFound)));
}

#[test]
fn test_authorization_checks() {
    let env = Env::default();
    let feedback_contract_id = env.register(FeedbackContract, ());
    let feedback_client = FeedbackContractClient::new(&env, &feedback_contract_id);
    let registry_contract_id = env.register(UserRegistryContract, ());
    let registry_client = UserRegistryContractClient::new(&env, &registry_contract_id);
    let admin = Address::generate(&env);
    let user = Address::generate(&env);
    let message = String::from_str(&env, "Auth is required.");

    registry_client.initialize(&admin);
    registry_client
        .mock_auths(&[MockAuth {
            address: &admin,
            invoke: &MockAuthInvoke {
                contract: &registry_contract_id,
                fn_name: "register_user",
                args: (&user,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .register_user(&user);
    feedback_client.initialize(&admin);

    let id = feedback_client
        .mock_auths(&[MockAuth {
            address: &user,
            invoke: &MockAuthInvoke {
                contract: &feedback_contract_id,
                fn_name: "create_feedback",
                args: (&user, &message, &registry_contract_id).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .create_feedback(&user, &message, &registry_contract_id);

    let review_result = feedback_client.try_review_feedback(&id);
    assert!(review_result.is_err());

    feedback_client
        .mock_auths(&[MockAuth {
            address: &admin,
            invoke: &MockAuthInvoke {
                contract: &feedback_contract_id,
                fn_name: "review_feedback",
                args: (&id,).into_val(&env),
                sub_invokes: &[],
            },
        }])
        .review_feedback(&id);
}

#[test]
fn test_empty_message_rejection() {
    let (env, feedback_client, _registry_client, registry_id, _admin, registered_user) = setup();
    let empty = String::from_str(&env, "");

    let result = feedback_client.try_create_feedback(&registered_user, &empty, &registry_id);

    assert_eq!(result, Err(Ok(FeedbackError::EmptyMessage)));
}

#[test]
fn test_feedback_events_include_lifecycle_payloads() {
    let env = Env::default();
    env.ledger()
        .with_mut(|ledger| ledger.timestamp = 1_700_000_001);
    env.mock_all_auths();

    let feedback_contract_id = env.register(FeedbackContract, ());
    let feedback_client = FeedbackContractClient::new(&env, &feedback_contract_id);
    let registry_contract_id = env.register(UserRegistryContract, ());
    let registry_client = UserRegistryContractClient::new(&env, &registry_contract_id);
    let admin = Address::generate(&env);
    let author = Address::generate(&env);
    let message = String::from_str(&env, "Events should be useful.");

    registry_client.initialize(&admin);
    registry_client.register_user(&author);
    feedback_client.initialize(&admin);

    let id = feedback_client.create_feedback(&author, &message, &registry_contract_id);
    let created = FeedbackCreated {
        id,
        author: author.clone(),
        status: Status::Pending,
        timestamp: 1_700_000_001,
    };
    assert_eq!(
        env.events().all().filter_by_contract(&feedback_contract_id),
        std::vec![created.to_xdr(&env, &feedback_contract_id)]
    );

    env.ledger()
        .with_mut(|ledger| ledger.timestamp = 1_700_000_002);
    feedback_client.review_feedback(&id);
    let reviewed = FeedbackReviewed {
        id,
        author: author.clone(),
        admin: admin.clone(),
        status: Status::Reviewed,
        timestamp: 1_700_000_002,
    };
    assert_eq!(
        env.events().all().filter_by_contract(&feedback_contract_id),
        std::vec![reviewed.to_xdr(&env, &feedback_contract_id)]
    );

    env.ledger()
        .with_mut(|ledger| ledger.timestamp = 1_700_000_003);
    feedback_client.resolve_feedback(&id);
    let resolved = FeedbackResolved {
        id,
        author,
        admin,
        status: Status::Resolved,
        timestamp: 1_700_000_003,
    };

    assert_eq!(
        env.events().all().filter_by_contract(&feedback_contract_id),
        std::vec![resolved.to_xdr(&env, &feedback_contract_id)]
    );
}
