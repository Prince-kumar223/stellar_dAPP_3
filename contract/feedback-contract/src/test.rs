#![cfg(test)]

use super::*;
use soroban_sdk::{Env, String};

#[test]
fn test_create_and_get_feedback() {
    let env = Env::default();
    let contract_id = env.register(FeedbackContract, ());
    let client = FeedbackContractClient::new(&env, &contract_id);

    // Test 1: Test feedback creation
    let text1 = String::from_str(&env, "Great app!");
    let id1 = client.create_feedback(&text1);
    assert_eq!(id1, 1);

    let text2 = String::from_str(&env, "Needs more features");
    let id2 = client.create_feedback(&text2);
    assert_eq!(id2, 2);

    // Test 2: Test fetching feedback
    let fetched1 = client.get_feedback(&id1);
    assert_eq!(fetched1, text1);

    let fetched2 = client.get_feedback(&id2);
    assert_eq!(fetched2, text2);
}

#[test]
fn test_invalid_id() {
    let env = Env::default();
    let contract_id = env.register(FeedbackContract, ());
    let client = FeedbackContractClient::new(&env, &contract_id);

    // Test 3: Test invalid ID handling
    // We haven't created any feedback, so ID 99 doesn't exist
    let result = client.get_feedback(&99);
    assert_eq!(result, String::from_str(&env, "Feedback not found"));
}

#[test]
fn test_multiple_feedbacks() {
    let env = Env::default();
    let contract_id = env.register(FeedbackContract, ());
    let client = FeedbackContractClient::new(&env, &contract_id);

    let first = String::from_str(&env, "First");
    let second = String::from_str(&env, "Second");

    let id1 = client.create_feedback(&first);
    let id2 = client.create_feedback(&second);

    assert!(id2 > id1);

    let feedback1 = client.get_feedback(&id1);
    let feedback2 = client.get_feedback(&id2);

    assert_eq!(feedback1, first);
    assert_eq!(feedback2, second);
}
