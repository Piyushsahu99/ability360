INSERT INTO public.institutions (name, code, type, city, state, website, is_verified) VALUES
('Indian Institute of Technology Bombay','IITB','university','Mumbai','Maharashtra','https://www.iitb.ac.in', true),
('Indian Institute of Technology Delhi','IITD','university','New Delhi','Delhi','https://home.iitd.ac.in', true),
('National Institute of Technology Tiruchirappalli','NITT','university','Tiruchirappalli','Tamil Nadu','https://www.nitt.edu', true),
('Delhi Technological University','DTU','university','New Delhi','Delhi','http://www.dtu.ac.in', true),
('Vellore Institute of Technology','VIT','university','Vellore','Tamil Nadu','https://vit.ac.in', true),
('Birla Institute of Technology and Science Pilani','BITS','university','Pilani','Rajasthan','https://www.bits-pilani.ac.in', true),
('Savitribai Phule Pune University','SPPU','university','Pune','Maharashtra','http://www.unipune.ac.in', true),
('Anna University','AU','university','Chennai','Tamil Nadu','https://www.annauniv.edu', true),
('Jadavpur University','JU','university','Kolkata','West Bengal','http://www.jaduniv.edu.in', true),
('Osmania University','OU','university','Hyderabad','Telangana','https://www.osmania.ac.in', true),
('Government Polytechnic Mumbai','GPM','polytechnic','Mumbai','Maharashtra','https://www.gpmumbai.ac.in', true),
('Government Polytechnic Pune','GPP','polytechnic','Pune','Maharashtra','https://gppune.ac.in', true),
('St. Xavier''s College Mumbai','SXC','college','Mumbai','Maharashtra','https://xaviers.edu', true),
('Christ University','CU','university','Bengaluru','Karnataka','https://christuniversity.in', true),
('Amity University Noida','AUN','university','Noida','Uttar Pradesh','https://www.amity.edu', true)
ON CONFLICT DO NOTHING;