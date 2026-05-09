import json, os, re

DATA_DIR = r'E:\mcq web\data'

# ── SUBTOPIC KEYWORD MAPS ──────────────────────────────────────────
SUBTOPIC_KEYS = {
    1: {
        "1.1": ["narrow ai","weak ai","general ai","super ai","strong ai","reactive machine",
                "limited memory","theory of mind","self-aware","john mccarthy","eliza","turing",
                "father of","mimic","scope of ai","types of ai","applications of ai",
                "ibm deep blue","self-driving","aims to","primarily aims","integrates ideas",
                "deep blue","intelligence primarily","hypothetical","exists"],
        "1.2": ["machine learning","supervised","unsupervised","reinforcement","deep learning",
                "neural network","backpropagation","k-means","clustering","regression",
                "q-learning","actor-critic","overfitting","labeled data","unlabeled",
                "weights","gradient","computer vision","nlp","natural language processing",
                "pca","logistic","data science","feature extract","spam detection",
                "large datasets","training data","ml improves","ml stands"],
        "1.3": ["generative ai","gpt","transformer","self-attention","gan","image generation",
                "text generation","generative","encoder decoder","bert","creates new content",
                "multi-head","positional encoding","layer normalization"],
        "1.4": ["cybersecurity","data poisoning","adversarial","mfa","multi-factor",
                "fraud detection","network anomal","evasion","ai-powered","attack",
                "security detects","ai in finance","ai in healthcare","robotics uses",
                "recommendation","cyber"],
    },
    2: {
        "2.1": ["iot stands","internet of things","characteristics of iot","features of iot",
                "advantages","limitations of iot","definition","what is iot","key characteristic",
                "physical objects","interconnect"],
        "2.2": ["physical design","logical design","architecture of iot","design of iot"],
        "2.3": ["sensor","actuator","temperature","humidity","transducer"],
        "2.4": ["5g","network slicing","mmtc","urllc","beamforming","latency",
                "data rate","media gateway","next generation network","autonomous driving",
                "peak data rate","energy efficiency","smart city","smart cities",
                "real-time","iot communication","application area"],
        "2.5": ["cloud","cloud computing","cloud based","architecture of cloud"],
    },
    3: {
        "3.1": ["who invented","satoshi","blockchain technology","distributed ledger",
                "what is a blockchain","genesis block","hash","first block",
                "links a block","miners perform","decentralization","transparency",
                "immutability","traditional vs","blockchain ledger","key feature"],
        "3.2": ["architecture","consensus","proof of work","proof of stake",
                "node","validator","block validation","merkle","mining process"],
        "3.3": ["public blockchain","private blockchain","consortium","hybrid blockchain",
                "types of blockchain","permissioned","permissionless","suitable for"],
        "3.4": ["application","finance","healthcare","supply chain","gaming",
                "real estate","voting","nft","defi","use case"],
        "3.5": ["smart contract","cryptocurrency","bitcoin","ethereum","altcoin",
                "token","wallet","solidity","popular cryptocurren","key features of smart"],
        "3.6": ["challenge","scalability","51%","fork","hard fork","soft fork",
                "limitation","energy consumption","drawback","risk","concern"],
    },
    4: {
        "4.1": ["augmented reality","virtual reality","mixed reality","extended reality",
                " ar ","\" ar\"","vr ","\" vr\"","haptic","immersive technolog",
                "types of immersive","introduction to immersive","xr ","metaverse"],
        "4.2": ["applications of immersive","application","entertainment","training sim",
                "education","healthcare vr","gaming application"],
        "4.3": ["green computing","e-waste","energy efficient","data center",
                "sustainable","recycling","carbon","environment","cooling"],
        "4.4": ["quantum","qubit","superposition","entanglement"],
    },
    5: {
        "5.1": ["digital forensics primarily","introduction to digital","definition of digital",
                "what is digital forensics","digital evidence","forensics deals"],
        "5.2": ["rules of digital","process of digital","evidence handling",
                "chain of custody","preservation","collection of evidence","rules"],
        "5.3": ["dfrws","adfm","idip","eedip","umdfpm","investigative model",
                "abstract digital","integrated digital","end to end","model of"],
        "5.4": ["ethical hacking","types of hackers","white hat","black hat",
                "grey hat","penetration","pen test","hacker definition","hacker is"],
        "5.5": ["phishing","ransomware","iot exploit","deepfake","waf","zero day",
                "firmware","os downgrade","network hacking","application hacking",
                "types of hacking","operating system hacking","deep fake","bypass"],
        "5.6": ["ncsp","it act","ccpwc","dpdp","cyber law","cyber crime",
                "cybercrime","2000","2008","2023","national cyber","scheme"],
    },
}

def tag_question(question_text, unit_id):
    q = question_text.lower()
    scores = {st: 0 for st in SUBTOPIC_KEYS[unit_id]}
    for st, keywords in SUBTOPIC_KEYS[unit_id].items():
        for kw in keywords:
            if kw in q:
                scores[st] += 1
    best = max(scores, key=scores.get)
    # If score is 0, assign to first subtopic (fallback)
    if scores[best] == 0:
        return list(SUBTOPIC_KEYS[unit_id].keys())[0], False
    return best, True

results = {}
for unit_id in range(1, 6):
    path = os.path.join(DATA_DIR, f'unit_{unit_id}.json')
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    tagged = matched = 0
    subtopic_counts = {}
    for q in data['questions']:
        st, hit = tag_question(q['question'], unit_id)
        q['subtopic'] = st
        if hit: matched += 1
        tagged += 1
        subtopic_counts[st] = subtopic_counts.get(st, 0) + 1

    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    results[unit_id] = subtopic_counts
    print(f"Unit {unit_id}: {tagged} questions tagged, {matched} keyword-matched")
    for st, cnt in sorted(subtopic_counts.items()):
        print(f"   {st}: {cnt} questions")
    print()

print("Tagging complete!")
