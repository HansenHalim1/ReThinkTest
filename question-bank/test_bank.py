"""Content checks using only the Python standard library."""
from copy import deepcopy
from fractions import Fraction
import math
import unittest

from tools import load_bank, public_question, validate


class BankTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bank = load_bank()
        cls.questions = {q['id']: q for q in cls.bank['questions']}

    def answer(self, qid):
        q = self.questions[qid]
        return next(o['text'] for o in q['options'] if o['id'] == q['answer']['optionId'])

    def test_integrity_and_required_coverage(self):
        self.assertEqual(validate(self.bank), [])
        self.assertEqual(len(self.questions), 126)
        self.assertEqual(len(self.bank['topics']), 42)
        for tid in ('e-inequalities', 'e-data-displays', 'g-annuities', 'a-limits', 'a-derivatives', 'a-derivative-applications', 'a-integrals'):
            self.assertEqual(sum(q['topicId'] == tid for q in self.bank['questions']), 3)

    def test_invalid_answers_and_cycles_are_rejected(self):
        bank = deepcopy(self.bank)
        bank['questions'][0]['answer']['optionId'] = 'z'
        self.assertTrue(any('answer is not an option' in error for error in validate(bank)))
        bank = deepcopy(self.bank)
        bank['topics'][0]['prerequisites'] = [bank['topics'][-1]['id']]
        self.assertTrue(any('must exist earlier' in error for error in validate(bank)))

    def test_public_payload_omits_all_grading_information(self):
        for question in self.bank['questions']:
            poisoned = {**question, 'privateHypothesis': 'internal', 'expected': 'answer', 'futurePrivateField': 'secret'}
            public = public_question(poisoned)
            self.assertEqual(set(public), {'id', 'version', 'topicId', 'skillId', 'format', 'prompt', 'options'})
            self.assertTrue(all(set(o) == {'id', 'text'} for o in public['options']))
            self.assertEqual(len(public['options']), 4)
            public['options'][0]['text'] = 'changed'
            self.assertNotEqual(question['options'][0]['text'], 'changed')

    def test_numeric_answers_against_independent_calculations(self):
        # Calculations use the problem values, not explanation text or answer keys.
        expected = {
            'f-integers-01': -7 + 12,
            'f-integers-02': 18 - 3 * 4,
            'f-integers-03': -4 + 9 - 3,
            'f-fractions-01': Fraction(1, 2) + Fraction(1, 4),
            'f-fractions-02': Fraction(3, 4) / Fraction(1, 2),
            'f-fractions-03': Fraction(3, 4) * Fraction(6, 4),
            'f-ratios-01': Fraction(2, 5) * 10,
            'f-ratios-02': 18000 // 3 * 5,
            'f-ratios-03': 6 * 8 // 12,
            'f-percentages-01': Fraction(15, 100) * 200,
            'f-percentages-02': 240000 * Fraction(75, 100),
            'f-linear-equations-01': 8 - 5,
            'f-linear-equations-02': Fraction(11 + 4, 3),
            'f-linear-equations-03': Fraction(29000 - 8000, 3000),
            'f-coordinates-01': 2 * 3 + 1,
            'f-coordinates-02': Fraction(8 - 2, 3 - 1),
            'f-pythagoras-01': math.isqrt(81),
            'f-pythagoras-02': math.isqrt(6**2 + 8**2),
            'f-pythagoras-03': math.isqrt(13**2 - 5**2),
            'e-exponents-02': 3**2,
            'e-exponents-03': Fraction(800, 2**3),
            'e-exponential-functions-01': int(math.log2(16)) - 1,
            'e-quadratic-graphs-03': max(-t*t + 6*t + 1 for t in range(7)),
            'e-trigonometry-01': Fraction(3, 5),
            'e-trigonometry-02': Fraction(8, 6),
            'e-trigonometry-03': round(20 * math.tan(math.pi / 4)),
            'e-quartiles-01': sorted([2, 4, 6, 8, 10])[2],
            'e-quartiles-02': Fraction(6 + 7, 2) - Fraction(2 + 3, 2),
            'e-data-displays-02': 75 - 25,
            'g-arithmetic-sequences-01': 10 + 3,
            'g-arithmetic-sequences-02': 5 + 9 * 4,
            'g-arithmetic-sequences-03': sum(12 + 2*i for i in range(10)),
            'g-geometric-sequences-01': 6 // 3,
            'g-geometric-sequences-02': sum(2 * 3**i for i in range(5)),
            'g-geometric-sequences-03': Fraction(8, 2**3),
            'g-interest-01': 1000000 * (1 + Fraction(10, 100) * 2),
            'g-interest-02': 1000000 * Fraction(110, 100)**2,
            'g-annuities-02': 1000000 * Fraction(101, 100) - 260000,
            'g-composition-01': 2 * 3**2 + 1,
            'g-bivariate-statistics-01': 2 * 4 + 5,
            'g-circles-01': 100 // 2,
            'g-circles-03': math.isqrt(13**2 - 5**2),
            'g-counting-01': 3 * 2,
            'g-counting-02': math.perm(5, 2),
            'g-counting-03': math.comb(6, 2),
            'g-compound-probability-01': Fraction(len([x for x in range(1,7) if x % 2 == 0]), 6),
            'g-compound-probability-02': Fraction(2, 4),
            'g-compound-probability-03': Fraction(2,10) * 150,
            'g-conditional-probability-01': Fraction(9,12),
            'g-conditional-probability-03': Fraction(3,5) * Fraction(2,4),
            'a-polynomials-01': 2**3 - 2*2 + 1,
            'a-polynomials-02': 1**3 + 2*1 + 4,
            'a-vectors-02': math.isqrt((-3)**2 + 4**2),
            'a-advanced-trigonometry-01': Fraction(1,2),
            'a-advanced-trigonometry-03': round(2 * math.pi / (math.pi / 20)),
            'a-rational-log-functions-01': int(math.log2(8)),
            'a-conics-02': 2 * math.isqrt(25),
            'a-binomial-02': math.comb(3,2) * Fraction(1,2)**3,
            'a-binomial-03': 200 * Fraction(5,100),
            'a-normal-01': Fraction(1,2),
            'a-normal-02': Fraction(80-70,5),
            'a-normal-03': 95,
            'a-limits-01': 3*2+1,
            'a-limits-02': 2+2,
            'a-derivatives-03': round(math.exp(0) + math.cos(0)),
            'a-derivative-applications-01': 2*3,
            'a-derivative-applications-02': 3*2**2-2,
            'a-derivative-applications-03': max(x*(10-x) for x in range(11)),
            'a-integrals-02': 2**3 - 0**3,
        }
        for qid, value in expected.items():
            with self.subTest(question=qid):
                answer = self.answer(qid)
                if answer.startswith('Rp'):
                    raw = answer[2:].replace('.', '')
                else:
                    raw = answer.split(' ')[0].replace(',', '.').replace('%', '').replace('°', '')
                self.assertEqual(Fraction(raw), value)

    def test_symbolic_and_contextual_answers(self):
        # Evaluate representative symbolic answers at several points, independently
        # of the old linear-only parser. No evaluation of bank-provided code.
        for x in (-3, 0, 2, 7):
            self.assertEqual(-2*(3*x-4)+x, -5*x+8)
            self.assertEqual(2*(x+(x+3)), 4*x+6)
            self.assertEqual(3*(x+2), 3*x+6)
            self.assertEqual(3*((x+6)/3)-6, x)
        roots = (complex(0, 2), complex(0, -2))
        self.assertTrue(all(x*x+4 == 0 for x in roots))
        self.assertEqual(Fraction(120,100)*Fraction(80,100), Fraction(96,100))
        self.assertEqual(Fraction(105,100)*Fraction(90,100), Fraction(945,1000))
        self.assertEqual(self.answer('e-quadratic-roots-02'), 'x = ±2i')
        self.assertEqual(self.answer('a-integrals-03'), 'Integral 0; luas 1')
        self.assertEqual(self.answer('a-derivatives-02'), '6(2x + 1)²')
        self.assertEqual(self.answer('a-matrices-02'), f'[[{1*3+2*4}], [{0*3+1*4}]]')
        self.assertEqual(self.answer('a-conics-03'), '3x + 4y = 25')
        self.assertEqual(3*3+4*4, 25)


if __name__ == '__main__':
    unittest.main()
