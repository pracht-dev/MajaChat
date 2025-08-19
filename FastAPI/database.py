import json
import random


# Get recent message

def get_recent_message():
    file_name = "stored_data.json"
    learn_instruction = {
        "role": "system",
        "content": "You are interviewing the user for a job as a Software Engineer at Bending Spoons. Ask short questions that are relevant to that position. Your Name is Maja. The user is called Glory. Keep yours answers under 30 words"
    }

    #  Initialize messages
    messages = []

    # Add a random element
    x = random.uniform(0, 1)
    if x < 0.5:
        learn_instruction["content"] = learn_instruction["content"] + " Your response will be some dry humor."
    else:
        learn_instruction["content"] = learn_instruction[
                                           "content"] + " Your response will include a rather challenging question."

    # Append instruction to message
    messages.append(learn_instruction)

    # Get last message
    try:
        with open(file_name) as conversation:
            data = json.load(conversation)


        # Append the last 5 items data
            if data:
                if len(data) < 5:
                    for item in data:
                        messages.append(item)
                else:
                    for item in data[-5:]:
                        messages.append(item)
    except Exception as e:
        print(f"[get_recent_message] Error: {e}")
        return None

    return messages


# Store messages
def store_messages(request_data, response_data):
    file_name = "stored_data.json"

   # Get recent message
    messages = get_recent_message()[1:]

    # Add messages to data
    user_message = {"role": "user", "content": request_data}
    assistant_message = {"role": "assistant", "content": response_data}
    messages.append(user_message)
    messages.append(assistant_message)

    # Save the updated data
    try:
        with open(file_name, "w") as conversation:
            json.dump(messages, conversation, indent=4)
    except Exception as e:
        print(f"[store_messages] Error: {e}")
        return None

# Reset messages
def reset_messages():
    # overwrite current file with an empty JSON object {}
    with open("stored_data.json", "w") as f:
        json.dump({}, f)