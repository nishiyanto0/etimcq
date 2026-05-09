import json, os

data_dir = r'E:\mcq web\data'
for fname in sorted(os.listdir(data_dir)):
    if fname.endswith('.json'):
        with open(os.path.join(data_dir, fname), encoding='utf-8') as f:
            data = json.load(f)
        print(fname + ': ' + str(data['totalQuestions']) + ' questions')
        for i, q in enumerate(data['questions'][:2]):
            print('  Q' + str(i+1) + ': ' + q['question'][:80])
            for j, opt in enumerate(q['options']):
                marker = ' <-- CORRECT' if j == q['correct'] else ''
                print('       [' + chr(65+j) + '] ' + str(opt)[:60] + marker)
            print('       Explanation: ' + q['explanation'][:100])
        print()
