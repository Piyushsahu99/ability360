UPDATE public.mock_test_questions
SET options = ARRAY['20%','25%','18%','12.5%']
WHERE prompt = 'An item bought for Rs 800 is sold for Rs 1,000. What is the profit percentage?';