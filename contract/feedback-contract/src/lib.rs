#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Env, String};

#[contracttype]
pub enum DataKey {
    FeedbackCount,
    Feedback(u32),
}

#[contract]
pub struct FeedbackContract;

#[contractimpl]
impl FeedbackContract {
    /// Creates a new feedback entry and returns its unique ID.
    pub fn create_feedback(env: Env, text: String) -> u32 {
        let count_key = DataKey::FeedbackCount;
        
        // Get current count, default to 0
        let mut count: u32 = env.storage().instance().get(&count_key).unwrap_or(0);
        
        // Increment count for the new ID
        count += 1;
        
        // Save the feedback text with the new ID
        let feedback_key = DataKey::Feedback(count);
        env.storage().instance().set(&feedback_key, &text);
        
        // Update the global count
        env.storage().instance().set(&count_key, &count);
        
        // Return the new ID
        count
    }

    /// Fetches a feedback text by its ID.
    pub fn get_feedback(env: Env, id: u32) -> String {
        let feedback_key = DataKey::Feedback(id);
        
        // Return the feedback if it exists, otherwise return a default "Not found" string
        env.storage()
            .instance()
            .get(&feedback_key)
            .unwrap_or(String::from_str(&env, "Feedback not found"))
    }
}

mod test;
