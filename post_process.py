"""
Post-processor: Enriches Unit 1 (AI) explanations & fixes minor parsing issues.
Also validates all units for corrupt questions.
"""
import json
import os
import re

DATA_DIR = r'E:\mcq web\data'

# ────────────────────────────────────────────────────
# Comprehensive AI explanations for Unit 1
# ────────────────────────────────────────────────────
AI_EXPLANATIONS = {
    "primarily aims to": "AI's core purpose is to mimic human intelligence — enabling machines to reason, learn, perceive, and make decisions just like humans do. It isn't about replacing hardware or simply speeding up networks.",
    "father of artificial intelligence": "John McCarthy coined the term 'Artificial Intelligence' in 1956 at the historic Dartmouth Conference. Alan Turing laid conceptual groundwork (Turing Test), but McCarthy is credited as the field's father.",
    "integrates ideas from": "AI is inherently multidisciplinary — drawing from computer science (algorithms), mathematics (statistics, logic), psychology (cognition), linguistics (NLP), philosophy (reasoning), and neuroscience.",
    "probability and statistics": "Mathematics — specifically probability and statistics — provides the foundation for uncertainty modeling, prediction, inference, and learning in AI systems.",
    "nlp stands for": "NLP = Natural Language Processing. It's the AI branch enabling computers to understand, interpret, and generate human language (speech and text).",
    "machine learning is a subset of": "ML is a subset of AI. AI is the broad goal (intelligent machines); ML is one approach to achieving it — letting machines learn from data rather than explicit programming.",
    "deep learning is a subset of": "Deep Learning is a subset of Machine Learning. It uses deep (multi-layered) neural networks to automatically learn complex patterns from large data — it's ML's most powerful modern branch.",
    "rational thinking": "'Think well' / rational thinking is the AI approach grounded in formal logic — making logically correct inferences based on rules and knowledge bases (like expert systems).",
    "eliza program": "ELIZA (1966, MIT) was a chatbot simulating a psychotherapist using pattern matching. It's the classic example of 'Act like humans' — passing the behavioral Turing Test without actually understanding.",
    "narrow ai": "Narrow AI (Weak AI) is designed for one specific task — like playing chess, recognizing faces, or recommending videos. It cannot generalize beyond its training scope.",
    "general ai currently": "AGI (Artificial General Intelligence) — a machine that can perform any cognitive task a human can — does not yet exist. It remains a long-term research goal.",
    "super ai": "Super AI (ASI) is the hypothetical scenario where machines surpass human intelligence across all domains. It doesn't exist yet and is a subject of philosophical and ethical debate.",
    "reactive machines": "Reactive machines are the simplest AI — they react only to current inputs with no memory of past events. IBM Deep Blue (chess) is the classic example: brilliant at chess, useless at anything else.",
    "ibm deep blue": "IBM Deep Blue is a reactive machine — it only evaluates the current chess board state. It has no memory of previous games and cannot learn or adapt beyond chess.",
    "self-driving cars": "Self-driving cars use Limited Memory AI — they temporarily store recent sensor data (other cars, speed, obstacles, lane lines) to make real-time navigation decisions.",
    "theory of mind": "Theory of Mind AI (in development) would understand human beliefs, emotions, desires, and intentions — enabling truly social, empathetic machine interactions.",
    "self-awareness": "Self-Aware AI (the highest tier) — machines with genuine consciousness and self-understanding — is purely hypothetical and doesn't exist in any current system.",
    "supervised learning uses": "Supervised learning trains on labeled data — pairs of (input, correct output). The model learns the mapping and can predict labels for new inputs. Like a student learning with an answer key.",
    "spam detection": "Spam detection is supervised learning — emails are pre-labeled 'spam' or 'ham' (not spam), and the classifier learns to distinguish them from these examples.",
    "k-means clustering": "K-Means is an unsupervised algorithm — it groups unlabeled data into K clusters based on feature similarity, discovering natural patterns without predefined categories.",
    "reinforcement learning works on": "Reinforcement learning uses a reward/penalty system — an agent takes actions, receives rewards for good ones and penalties for bad ones, learning the optimal strategy over time (like training a dog).",
    "q-learning": "Q-learning is a model-free RL algorithm where an agent learns the value (Q-value) of taking specific actions in specific states, building a policy for optimal decision-making.",
    "deep learning uses": "Deep Learning is powered by artificial neural networks — multi-layered architectures inspired by the brain's neurons, capable of learning hierarchical representations from raw data.",
    "deep learning requires": "Deep Learning's power comes at a cost: it needs massive datasets to train effectively. With small data, deep nets overfit badly and perform poorly on new examples.",
    "neural networks are inspired by": "Artificial neural networks (ANNs) are loosely modeled after the biological brain — with artificial neurons (nodes) connected by weighted edges (synapses) that adjust during learning.",
    "backpropagation": "Backpropagation ('backprop') is the training algorithm for neural networks — it computes the gradient of the loss function with respect to each weight and updates them to reduce error.",
    "data science mainly focuses on": "Data Science extracts knowledge and actionable insights from structured and unstructured data using a blend of statistics, ML, domain expertise, and data visualization.",
    "deep learning automatically": "Deep Learning's game-changer is automatic feature extraction — unlike traditional ML that requires manual feature engineering, deep nets learn relevant representations directly from raw data.",
    "disadvantage of deep learning": "Deep Learning's main drawback is its 'black box' nature — it's extremely hard to interpret why a model made a specific prediction, which is problematic in medical, legal, and safety-critical domains.",
    "ai in healthcare": "AI in healthcare powers diagnostic imaging (detecting tumors), drug discovery, patient risk prediction, robotic surgery assistance, and personalized treatment recommendations.",
    "ai in finance": "AI's biggest impact in finance is fraud detection — systems analyze millions of transactions in real-time, flagging anomalies that deviate from a user's normal behavior patterns.",
    "recommendation systems": "Recommendation systems (Netflix, Spotify, Amazon) use collaborative filtering and content-based ML to analyze user preferences and behavior to suggest relevant items.",
    "actor-critic": "Actor-Critic combines two RL approaches: the Actor (policy network) decides what action to take; the Critic (value network) evaluates how good that action was — together they train more stably.",
    "gans are used in": "GANs (Generative Adversarial Networks) consist of two competing networks — a Generator creates fake images; a Discriminator distinguishes real from fake — driving each other to improve.",
    "generative ai creates": "Generative AI generates new, original content — images, text, music, video, code — by learning the statistical patterns of training data and sampling from that distribution.",
    "gpt is based on": "GPT (Generative Pre-trained Transformer) uses the Transformer architecture's self-attention mechanism to model long-range dependencies in text, enabling remarkable language generation.",
    "self-attention": "Self-attention allows Transformers to weigh the relevance of each word relative to every other word in a sequence simultaneously — crucial for understanding context in language.",
    "data poisoning": "Data poisoning is an adversarial attack where malicious data is injected into the training set, causing the model to learn incorrect patterns and produce biased or wrong predictions.",
    "mfa stands for": "MFA = Multi-Factor Authentication — a security mechanism requiring 2+ independent verification factors (something you know + something you have + something you are) to authenticate.",
    "overfitting": "Overfitting occurs when a model learns the training data too precisely — including noise — and fails to generalize to new data. It performs great on training but poorly in the real world.",
    "ibm watson": "IBM Watson is a Narrow AI system — it excels at specific domains like natural language Q&A and medical diagnosis, but it's task-specific and cannot generalize like a human.",
    "computer vision": "Computer Vision enables machines to interpret visual information from images and videos — applications include facial recognition, medical imaging, autonomous driving, and quality inspection.",
    "logistic regression": "Logistic Regression is a supervised learning algorithm for classification — despite its name, it predicts probabilities (using the sigmoid function) to classify inputs into discrete categories.",
    "pca is used for": "PCA (Principal Component Analysis) reduces dataset dimensionality by finding the axes of maximum variance (principal components), removing redundant features while preserving information.",
    "ai's goal": "AI's fundamental goal is to create systems that exhibit intelligent behavior — the ability to perceive environments, reason about problems, learn from experience, and act to achieve goals.",
    "robotics uses ai for": "AI enables robots to go beyond pre-programmed movements — they can perceive their environment with sensors, plan paths dynamically, adapt to changes, and perform complex autonomous tasks.",
    "ai-powered cybersecurity": "AI cybersecurity monitors network traffic patterns continuously, detecting anomalies (unusual access patterns, data exfiltration, intrusions) that signature-based systems would miss.",
    "deep learning works best for": "Deep Learning excels at high-dimensional, complex tasks — image recognition, speech-to-text, machine translation — where traditional ML cannot learn the intricate patterns from raw data.",
    "ml improves performance by": "ML systems improve through experience — as the model processes more training examples, it iteratively adjusts its internal parameters (weights) to minimize prediction errors.",
    "ml stands for": "ML = Machine Learning — a branch of AI where systems learn patterns from data and improve their performance on tasks without being explicitly programmed for each rule.",
    "examples of supervised learning": "Supervised learning examples include: email spam classification, house price prediction, image classification, medical diagnosis, and sentiment analysis — all use labeled training data.",
    "unsupervised learning": "Unsupervised learning finds hidden patterns or structures in unlabeled data — examples include K-Means clustering, DBSCAN, PCA for dimensionality reduction, and autoencoders.",
    "natural language processing": "NLP enables machines to work with human language — tasks include sentiment analysis, machine translation, chatbots, text summarization, and named entity recognition.",
    "neural network layers": "Neural networks have three types of layers: Input layer (receives data), Hidden layers (learn representations), and Output layer (produces final prediction). More hidden layers = 'deeper' network.",
    "activation function": "Activation functions (ReLU, Sigmoid, Tanh) introduce non-linearity into neural networks — without them, networks could only model linear relationships regardless of depth.",
    "training data": "Training data is the labeled dataset used to teach an ML model. Its quality, size, and diversity directly determine how well the model performs on real-world tasks.",
    "model accuracy": "Model accuracy measures the percentage of correct predictions out of total predictions. While useful, accuracy alone can be misleading with imbalanced datasets.",
    "classification": "Classification is a supervised learning task where the model predicts which category an input belongs to (e.g., spam/not spam, cat/dog, disease/healthy).",
    "regression": "Regression predicts continuous numerical values (e.g., house prices, stock prices, temperature) rather than discrete categories.",
    "clustering": "Clustering is an unsupervised technique that groups similar data points together — useful for customer segmentation, document grouping, and anomaly detection.",
    "transfer learning": "Transfer learning reuses a pre-trained model (e.g., ImageNet-trained CNN) on a new related task, dramatically reducing training time and data requirements.",
    "bias in ai": "AI bias occurs when models reflect prejudices present in training data, leading to unfair outcomes — a critical ethical issue in hiring algorithms, facial recognition, and criminal justice AI.",
    "explainable ai": "Explainable AI (XAI) aims to make AI decision-making transparent and understandable to humans — crucial for trust, compliance, and debugging in high-stakes applications.",
    "robotics process automation": "RPA uses software bots to automate repetitive rule-based business processes — like data entry, invoice processing, and report generation — without human intervention.",
    "computer vision object detection": "Object detection combines image classification (what) with localization (where) — algorithms like YOLO and Faster R-CNN identify and locate multiple objects in a single pass.",
    "sentiment analysis": "Sentiment analysis (opinion mining) uses NLP to determine the emotional tone of text — positive, negative, or neutral — used in social media monitoring and customer feedback analysis.",
}

def enrich_explanation(question, correct_text, existing_explanation):
    """Improve generic explanations using keyword matching."""
    q_lower = question.lower()
    
    # If already has a real explanation (not generic), keep it
    if not existing_explanation.startswith("The correct answer is"):
        return existing_explanation
    
    # Find best matching explanation
    best_key = None
    best_score = 0
    for key, expl in AI_EXPLANATIONS.items():
        # Count keyword matches
        key_words = key.split()
        score = sum(1 for w in key_words if w in q_lower)
        if score > best_score:
            best_score = score
            best_key = key
    
    if best_key and best_score >= 2:
        return AI_EXPLANATIONS[best_key]
    
    # Fallback: generate from correct answer
    return (
        f"The correct answer is '{correct_text}'. "
        f"This is a key concept in AI — understanding it helps you reason through related questions even when answer choices are shuffled. "
        f"Review this topic in the AI fundamentals section for deeper clarity."
    )

def validate_question(q):
    """Return True if question looks valid."""
    if not q.get("question") or len(q["question"]) < 5:
        return False
    opts = q.get("options", [])
    if len(opts) < 2:
        return False
    # Check correct index is valid
    if q.get("correct", -1) not in range(len(opts)):
        return False
    # Options should have actual content
    non_empty = [o for o in opts if o.strip()]
    if len(non_empty) < 2:
        return False
    return True

def process_unit(unit_num):
    path = os.path.join(DATA_DIR, f"unit_{unit_num}.json")
    with open(path, encoding='utf-8') as f:
        data = json.load(f)
    
    original_count = len(data["questions"])
    valid_questions = []
    
    for q in data["questions"]:
        if not validate_question(q):
            continue
        
        # Enrich explanation for unit 1 (AI)
        if unit_num == 1:
            q["explanation"] = enrich_explanation(
                q["question"], q.get("correctText", ""), q.get("explanation", "")
            )
        
        valid_questions.append(q)
    
    data["questions"] = valid_questions
    data["totalQuestions"] = len(valid_questions)
    
    print(f"Unit {unit_num}: {original_count} -> {len(valid_questions)} valid questions")
    
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    return len(valid_questions)

print("Post-processing all units...")
total = 0
for u in range(1, 6):
    total += process_unit(u)

print(f"\nTotal valid questions across all units: {total}")
print("Post-processing complete!")
