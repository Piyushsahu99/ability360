INSERT INTO public.resources (slug, title, category, summary, body, organisation, benefit, eligibility, deadline_label, region, tags, link, image_key, is_published, auto_imported, source_url, source_domain, expires_at, audience) VALUES
('learn-indian-sign-language-islrtc', 'Learn Indian Sign Language (ISLRTC)', 'divyangjan', 'Free Indian Sign Language courses and an official ISL video dictionary from the Indian Sign Language Research and Training Centre.', 'The Indian Sign Language Research and Training Centre (ISLRTC) is the national body for Indian Sign Language. It offers free and low-cost ISL courses, an official video dictionary, and teaching material for students, parents and teachers.

Anyone can start learning — deaf and hard-of-hearing students, their friends and families, and hearing students who want to communicate inclusively.

Visit the ISLRTC website to enrol in a course or browse the video dictionary.', 'ISLRTC, New Delhi', 'Free ISL courses and official video dictionary', 'Open to everyone; no prior knowledge needed', 'Always available', 'All India', ARRAY['sign language','isl','deaf','free course'], 'https://islrtc.nic.in/', 'divyangjan', true, false, 'https://islrtc.nic.in/', 'islrtc.nic.in', NULL, ARRAY['Divyangjan students','All students']),
('islrtc-youtube-channel', 'ISLRTC YouTube Channel — Free ISL Video Lessons', 'divyangjan', 'Free video lessons in Indian Sign Language — alphabets, everyday words and full conversations with captions.', 'The official ISLRTC YouTube channel publishes free Indian Sign Language video lessons: the ISL alphabet, everyday vocabulary, and full conversations, most with captions.

It is the easiest way to start learning ISL on your phone, at your own pace, for free.

Subscribe and practise a few signs every day.', 'ISLRTC (YouTube)', 'Free ISL video lessons with captions', 'Open to everyone', 'Always available', 'All India', ARRAY['sign language','isl','youtube','video lessons'], 'https://www.youtube.com/@ISLRTC', 'divyangjan', true, false, 'https://www.youtube.com/@ISLRTC', 'youtube.com', NULL, ARRAY['Divyangjan students','All students']),
('nish-online-isl-courses', 'NISH Online Indian Sign Language Courses', 'divyangjan', 'Structured online Indian Sign Language courses from the National Institute of Speech and Hearing, Kerala.', 'The National Institute of Speech and Hearing (NISH) runs structured online Indian Sign Language courses, from beginner to advanced levels, with live interactive sessions.

Courses are open to deaf and hearing learners across India, including family members of deaf children and students who want to become interpreters.

Check the NISH website for the next batch and fees.', 'National Institute of Speech and Hearing (NISH)', 'Structured online ISL courses with live sessions', 'Open to deaf and hearing learners across India', 'Batches open through the year', 'All India', ARRAY['sign language','isl','online course'], 'https://nish.ac.in/', 'divyangjan', true, false, 'https://nish.ac.in/', 'nish.ac.in', NULL, ARRAY['Divyangjan students','All students']),
('enable-india-training', 'Enable India — Employability & Computer Training', 'divyangjan', 'Free employability and computer training for persons with disabilities, plus a large inclusive-jobs network.', 'Enable India is one of India''s largest organisations working on the livelihood of persons with disabilities. It offers free computer training, employability skills, and placement support across many cities and online.

Programmes cover visual, hearing, locomotor and intellectual disabilities, with training adapted to each group.

Register on the Enable India website to join a programme.', 'Enable India, Bengaluru', 'Free training and placement support', 'Persons with disabilities; programmes vary by city and online', 'Always available', 'All India', ARRAY['training','employment','free'], 'https://www.enableindia.org/', 'divyangjan', true, false, 'https://www.enableindia.org/', 'enableindia.org', NULL, ARRAY['Divyangjan students']),
('nvda-free-screen-reader', 'NVDA — Free Screen Reader for Windows', 'divyangjan', 'A free, open-source screen reader so blind and low-vision students can study and work independently on a computer.', 'NVDA (NonVisual Desktop Access) is a free, open-source screen reader for Windows. It reads aloud everything on the screen and supports Braille displays.

It lets blind and low-vision students use email, browsers, Office and coding tools without paying for expensive software.

Download it free from the official NV Access website.', 'NV Access', 'Free screen reader, no licence cost', 'Blind and low-vision users on Windows', 'Always available', 'All India', ARRAY['screen reader','assistive technology','blind','free tool'], 'https://www.nvaccess.org/', 'divyangjan', true, false, 'https://www.nvaccess.org/', 'nvaccess.org', NULL, ARRAY['Divyangjan students']),
('barrierbreak-accessibility-careers', 'Digital Accessibility Skills & Careers (BarrierBreak)', 'divyangjan', 'Courses on accessibility testing and inclusive design — a growing, well-paid career path open to everyone.', 'Digital accessibility is a fast-growing field: companies need people who can test websites and apps for accessibility and design inclusively.

BarrierBreak, an Indian accessibility company, runs training and certification in accessibility testing — a career path that is open to everyone and especially welcoming to persons with disabilities.

Explore their academy to see current courses.', 'BarrierBreak, Mumbai', 'Accessibility testing skills and certification', 'Open to everyone; basic computer use helpful', 'Always available', 'All India', ARRAY['accessibility','career','testing','course'], 'https://www.barrierbreak.com/', 'divyangjan', true, false, 'https://www.barrierbreak.com/', 'barrierbreak.com', NULL, ARRAY['Divyangjan students','All students'])
ON CONFLICT (source_url) DO NOTHING;