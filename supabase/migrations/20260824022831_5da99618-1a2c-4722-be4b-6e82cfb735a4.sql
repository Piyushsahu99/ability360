CREATE TABLE public.career_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  course text NOT NULL,
  branch text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  summary text NOT NULL DEFAULT '',
  responsibilities text[] NOT NULL DEFAULT '{}',
  skills text[] NOT NULL DEFAULT '{}',
  certifications text[] NOT NULL DEFAULT '{}',
  fresher_min_lpa numeric(5,2) NOT NULL DEFAULT 0,
  fresher_max_lpa numeric(5,2) NOT NULL DEFAULT 0,
  experienced_min_lpa numeric(6,2) NOT NULL DEFAULT 0,
  experienced_max_lpa numeric(6,2) NOT NULL DEFAULT 0,
  experienced_label text NOT NULL DEFAULT '5+ years',
  demand text NOT NULL DEFAULT 'moderate',
  growth_path text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.career_roles TO anon;
GRANT SELECT ON public.career_roles TO authenticated;
GRANT ALL ON public.career_roles TO service_role;

ALTER TABLE public.career_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY career_roles_public_read ON public.career_roles
  FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY career_roles_admin_insert ON public.career_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY career_roles_admin_update ON public.career_roles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY career_roles_admin_delete ON public.career_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER career_roles_set_updated_at BEFORE UPDATE ON public.career_roles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX career_roles_course_branch_idx ON public.career_roles (course, branch);

ALTER TABLE public.student_profiles
  ADD COLUMN target_role_id uuid REFERENCES public.career_roles(id) ON DELETE SET NULL,
  ADD COLUMN target_role_selected_at timestamptz;

INSERT INTO public.career_roles
  (slug, title, course, branch, category, summary, responsibilities, skills, certifications,
   fresher_min_lpa, fresher_max_lpa, experienced_min_lpa, experienced_max_lpa, demand, growth_path)
VALUES
('software-engineer','Software Engineer','B.Tech','Computer Science','technology',
 'Designs, builds and maintains production software systems used by real customers.',
 ARRAY['Translate product requirements into working, tested code','Review teammates'' pull requests and keep code quality high','Debug production incidents and ship fixes','Write unit and integration tests','Document services and APIs'],
 ARRAY['Data structures & algorithms','Java / Python / JavaScript','Git & code review','SQL','System design basics'],
 ARRAY['AWS Certified Developer – Associate','Oracle Certified Professional: Java SE','Meta Back-End Developer (Coursera)'],
 4.5,12.0,18.0,45.0,'very high','Software Engineer to Senior Engineer to Tech Lead to Engineering Manager / Architect'),

('frontend-developer','Frontend Developer','B.Tech','Computer Science','technology',
 'Builds the interfaces users actually touch — fast, accessible and responsive web apps.',
 ARRAY['Convert designs into responsive, accessible interfaces','Manage client-side state and API integration','Optimise page load and rendering performance','Ensure WCAG accessibility compliance','Maintain a shared component library'],
 ARRAY['HTML, CSS, JavaScript','React / TypeScript','Responsive & accessible design','Testing (Jest, Playwright)','Web performance'],
 ARRAY['Meta Front-End Developer Certificate','Google Mobile Web Specialist','IAAP WAS (accessibility)'],
 3.5,10.0,14.0,32.0,'high','Frontend Developer to Senior Frontend to Frontend Architect / Design Systems Lead'),

('backend-developer','Backend Developer','B.Tech','Computer Science','technology',
 'Owns the servers, APIs and databases that power an application.',
 ARRAY['Design and build REST/GraphQL APIs','Model and optimise databases','Add caching, queues and background jobs','Secure endpoints and handle authentication','Monitor latency and error budgets'],
 ARRAY['Node.js / Java / Go / Python','SQL & database design','API design','Redis, message queues','Docker'],
 ARRAY['AWS Certified Developer – Associate','MongoDB Associate Developer','Spring Professional Certification'],
 4.0,11.0,16.0,38.0,'very high','Backend Developer to Senior Backend to Principal Engineer / Platform Lead'),

('full-stack-developer','Full Stack Developer','B.Tech','Computer Science','technology',
 'Works across the whole product — UI, API and database — usually in fast-moving teams.',
 ARRAY['Ship features end to end from UI to database','Set up CI/CD and deployments','Fix bugs across all layers of the stack','Work directly with product and design','Own small services from idea to release'],
 ARRAY['React / TypeScript','Node.js or Django','PostgreSQL','Git & CI/CD','Cloud fundamentals'],
 ARRAY['Meta Full-Stack Engineer Certificate','AWS Certified Cloud Practitioner','MongoDB Associate Developer'],
 4.0,12.0,16.0,36.0,'very high','Full Stack Developer to Senior Engineer to Product Engineering Lead / Startup CTO'),

('data-analyst','Data Analyst','B.Tech','Computer Science','data',
 'Turns raw business data into dashboards and decisions leaders can act on.',
 ARRAY['Write SQL queries to answer business questions','Build dashboards in Power BI or Tableau','Clean and validate messy datasets','Present insights to non-technical stakeholders','Track KPIs and flag anomalies'],
 ARRAY['SQL','Excel / Google Sheets','Power BI or Tableau','Python (pandas)','Statistics & storytelling'],
 ARRAY['Google Data Analytics Certificate','Microsoft PL-300 (Power BI)','Tableau Desktop Specialist'],
 3.5,9.0,12.0,26.0,'very high','Data Analyst to Senior Analyst to Analytics Manager / Data Scientist'),

('data-scientist','Data Scientist','B.Tech','Computer Science','data',
 'Builds statistical and machine learning models that predict and optimise business outcomes.',
 ARRAY['Frame business problems as data problems','Engineer features and train models','Run A/B tests and interpret results','Communicate model impact to stakeholders','Partner with engineers to productionise models'],
 ARRAY['Python & pandas','Statistics & probability','Machine learning','SQL','Data visualisation'],
 ARRAY['IBM Data Science Professional Certificate','AWS Certified Machine Learning – Specialty','Databricks Certified ML Associate'],
 6.0,14.0,20.0,45.0,'high','Data Scientist to Senior Data Scientist to Principal DS / Head of Data'),

('ml-engineer','Machine Learning Engineer','B.Tech','Computer Science','data',
 'Takes models out of notebooks and runs them reliably in production.',
 ARRAY['Build training and inference pipelines','Deploy and monitor models at scale','Optimise latency, cost and drift','Version datasets and experiments','Work with data scientists on model handoff'],
 ARRAY['Python','PyTorch / TensorFlow','MLOps (MLflow, Kubeflow)','Docker & Kubernetes','Cloud ML services'],
 ARRAY['TensorFlow Developer Certificate','Google Professional Machine Learning Engineer','AWS ML Specialty'],
 6.0,16.0,22.0,50.0,'high','ML Engineer to Senior MLE to ML Platform Lead / AI Architect'),

('devops-engineer','DevOps Engineer','B.Tech','Computer Science','infrastructure',
 'Automates build, release and infrastructure so teams can ship safely and often.',
 ARRAY['Build and maintain CI/CD pipelines','Manage infrastructure as code','Set up monitoring, logging and alerting','Handle on-call and incident response','Harden deployments and reduce cloud cost'],
 ARRAY['Linux & shell scripting','Docker & Kubernetes','Terraform','AWS / Azure / GCP','Prometheus & Grafana'],
 ARRAY['AWS Certified DevOps Engineer – Professional','Certified Kubernetes Administrator (CKA)','HashiCorp Terraform Associate'],
 4.5,12.0,18.0,42.0,'very high','DevOps Engineer to SRE to Platform Engineering Lead'),

('cloud-engineer','Cloud Engineer','B.Tech','Computer Science','infrastructure',
 'Designs and runs workloads on cloud platforms with an eye on cost and reliability.',
 ARRAY['Provision cloud infrastructure','Migrate on-prem workloads to cloud','Design for high availability and DR','Implement IAM and network security','Track and optimise cloud spend'],
 ARRAY['AWS or Azure core services','Networking fundamentals','Terraform / CloudFormation','Linux','Cost optimisation'],
 ARRAY['AWS Solutions Architect – Associate','Microsoft AZ-104','Google Associate Cloud Engineer'],
 4.0,11.0,16.0,38.0,'high','Cloud Engineer to Cloud Architect to Head of Infrastructure'),

('cybersecurity-analyst','Cybersecurity Analyst','B.Tech','Computer Science','security',
 'Defends systems and data by detecting, investigating and preventing attacks.',
 ARRAY['Monitor SIEM alerts and triage incidents','Run vulnerability assessments','Investigate phishing and malware reports','Write and enforce security policies','Support audits and compliance reviews'],
 ARRAY['Networking & TCP/IP','Linux & Windows internals','SIEM tools','Threat modelling','Scripting (Python/Bash)'],
 ARRAY['CompTIA Security+','Certified Ethical Hacker (CEH)','ISC2 Certified in Cybersecurity (CC)'],
 4.0,10.0,15.0,35.0,'high','Security Analyst to Senior Analyst to Security Architect / CISO track'),

('qa-automation-engineer','QA Automation Engineer','B.Tech','Computer Science','technology',
 'Builds automated test suites so releases stay safe as products grow.',
 ARRAY['Write automated UI and API test suites','Own regression runs in CI','Report, reproduce and track defects','Define test strategy with product teams','Measure and improve test coverage'],
 ARRAY['Selenium / Playwright / Cypress','Java or Python','API testing (Postman, REST Assured)','CI pipelines','Test design techniques'],
 ARRAY['ISTQB Certified Tester – Foundation','Certified Selenium Professional','Postman API Test Automation'],
 3.5,8.0,12.0,26.0,'high','QA Engineer to SDET to QA Architect / Quality Manager'),

('mobile-app-developer','Mobile App Developer','B.Tech','Computer Science','technology',
 'Builds Android and iOS apps used by millions of Indian users every day.',
 ARRAY['Build and ship native or cross-platform apps','Integrate REST APIs and offline storage','Optimise app size, battery and performance','Handle Play Store / App Store releases','Fix crashes reported from production'],
 ARRAY['Kotlin / Swift / React Native / Flutter','Mobile UI patterns','REST APIs','App store deployment','Crash analytics'],
 ARRAY['Google Associate Android Developer','Meta React Native Specialization','Flutter Certified Application Developer'],
 4.0,10.0,14.0,32.0,'high','Mobile Developer to Senior Mobile Dev to Mobile Architect'),

('ui-ux-designer','UI/UX Designer','B.Tech','Computer Science','design',
 'Researches users and designs accessible, usable product experiences.',
 ARRAY['Run user research and usability tests','Create wireframes and interactive prototypes','Maintain the design system','Work with engineers on handoff','Audit flows for accessibility'],
 ARRAY['Figma','User research','Interaction design','Accessibility (WCAG)','Design systems'],
 ARRAY['Google UX Design Certificate','NN/g UX Certification','IAAP CPACC (accessibility)'],
 3.5,9.0,12.0,28.0,'moderate','UI/UX Designer to Senior Designer to Design Lead / Head of Design'),

('embedded-systems-engineer','Embedded Systems Engineer','B.Tech','Electronics & Communication','hardware',
 'Writes firmware that makes physical devices work — from wearables to industrial controllers.',
 ARRAY['Develop and debug firmware in C/C++','Bring up new boards and peripherals','Work with RTOS and interrupt handling','Test with oscilloscopes and logic analysers','Optimise memory and power consumption'],
 ARRAY['C / C++','Microcontrollers (ARM, ESP32)','RTOS','Circuit reading & debugging','Communication protocols (I2C, SPI, UART)'],
 ARRAY['ARM Accredited Engineer','Certified LabVIEW Associate Developer','Embedded Systems Specialization (UC Boulder)'],
 3.5,9.0,12.0,30.0,'high','Embedded Engineer to Senior Firmware Engineer to Embedded Architect'),

('vlsi-design-engineer','VLSI Design Engineer','B.Tech','Electronics & Communication','hardware',
 'Designs and verifies the digital chips behind modern electronics.',
 ARRAY['Write RTL in Verilog/VHDL','Run functional verification with testbenches','Perform synthesis and timing analysis','Debug simulation and silicon issues','Document design specifications'],
 ARRAY['Verilog / SystemVerilog','Digital design','Static timing analysis','Scripting (TCL, Python)','EDA tools'],
 ARRAY['Cadence Certified Designer','Synopsys VLSI Certification','VSD RTL Design Certification'],
 4.5,12.0,18.0,45.0,'high','Design Engineer to Senior VLSI Engineer to Design Manager'),

('iot-engineer','IoT Engineer','B.Tech','Electronics & Communication','hardware',
 'Connects sensors and devices to cloud platforms for smart products and factories.',
 ARRAY['Build sensor-to-cloud data pipelines','Program edge devices and gateways','Handle device provisioning and OTA updates','Secure device communication','Build monitoring dashboards'],
 ARRAY['Embedded C / Python','MQTT & networking','Cloud IoT platforms','Edge computing','Sensor integration'],
 ARRAY['AWS IoT Certification','Cisco IoT Fundamentals','Microsoft Azure IoT Developer Specialty'],
 3.5,9.0,12.0,28.0,'moderate','IoT Engineer to IoT Solutions Architect to Product Manager (IoT)'),

('network-engineer','Network Engineer','B.Tech','Electronics & Communication','infrastructure',
 'Keeps enterprise and telecom networks fast, secure and always available.',
 ARRAY['Configure routers, switches and firewalls','Troubleshoot connectivity and latency issues','Plan network capacity and upgrades','Document network topology','Support 24x7 network operations'],
 ARRAY['TCP/IP & routing protocols','Cisco IOS','Firewalls & VPNs','Network monitoring','Wireless & LAN/WAN design'],
 ARRAY['Cisco CCNA','CompTIA Network+','Juniper JNCIA'],
 3.0,7.5,10.0,24.0,'moderate','Network Engineer to Network Architect to Infrastructure Manager'),

('mechanical-design-engineer','Mechanical Design Engineer','B.Tech','Mechanical','core-engineering',
 'Designs components and assemblies in CAD and validates them before manufacturing.',
 ARRAY['Create 3D models and 2D manufacturing drawings','Run design calculations and tolerance stack-ups','Perform FEA simulations','Coordinate with manufacturing on producibility','Maintain BOMs and revision control'],
 ARRAY['SolidWorks / CATIA / Creo','GD&T','FEA (ANSYS)','Design for manufacturing','Engineering drawing standards'],
 ARRAY['Certified SolidWorks Professional (CSWP)','ANSYS Certified Professional','ASME GD&T Certification'],
 3.0,7.0,10.0,24.0,'moderate','Design Engineer to Senior Design Engineer to Design Manager / R&D Lead'),

('production-engineer','Production / Manufacturing Engineer','B.Tech','Mechanical','core-engineering',
 'Runs and improves the shop floor so plants produce on time, on cost and on quality.',
 ARRAY['Plan and monitor daily production targets','Improve cycle time and reduce waste','Lead root-cause analysis on line stoppages','Enforce safety and 5S standards','Train and coordinate shop-floor teams'],
 ARRAY['Lean manufacturing','Six Sigma basics','Production planning','Quality tools (7QC)','ERP systems (SAP PP)'],
 ARRAY['Six Sigma Green Belt','Certified Production Technician','SAP PP Certification'],
 3.0,6.5,9.0,22.0,'moderate','Production Engineer to Shift Manager to Plant Head'),

('automotive-rd-engineer','Automotive R&D Engineer','B.Tech','Mechanical','core-engineering',
 'Develops and tests vehicle systems for performance, safety and emissions targets.',
 ARRAY['Build and test prototypes','Run vehicle and component validation','Analyse test data against targets','Work with suppliers on component design','Document homologation compliance'],
 ARRAY['Vehicle dynamics','CAE / MATLAB','Testing & instrumentation','CAD','Automotive standards (AIS, ARAI)'],
 ARRAY['MATLAB/Simulink Certification','Automotive Functional Safety (ISO 26262)','ARAI Certification Programmes'],
 3.5,8.0,12.0,28.0,'moderate','R&D Engineer to Senior Engineer to Programme Manager'),

('civil-site-engineer','Site Engineer','B.Tech','Civil','core-engineering',
 'Runs construction execution on the ground — quality, schedule and safety.',
 ARRAY['Supervise daily construction activity','Check work against drawings and specifications','Maintain quality and safety records','Coordinate contractors and material supply','Report progress against the schedule'],
 ARRAY['Construction methods','AutoCAD','Quantity estimation','Project scheduling (MSP/Primavera)','Site safety'],
 ARRAY['Primavera P6 Certification','OSHA Construction Safety','LEED Green Associate'],
 2.5,6.0,8.0,20.0,'moderate','Site Engineer to Project Engineer to Project Manager'),

('structural-engineer','Structural Engineer','B.Tech','Civil','core-engineering',
 'Analyses and designs safe structures — buildings, bridges and industrial frames.',
 ARRAY['Model and analyse structures','Design RCC and steel members to IS codes','Prepare structural drawings and reports','Review site queries and revisions','Coordinate with architects and MEP teams'],
 ARRAY['STAAD.Pro / ETABS','RCC & steel design','IS codes','AutoCAD','Structural mechanics'],
 ARRAY['STAAD.Pro Certification','ETABS Professional Certification','Chartered Engineer (IEI)'],
 3.0,7.0,10.0,25.0,'moderate','Structural Engineer to Senior Structural Engineer to Design Head'),

('bim-engineer','BIM Engineer','B.Tech','Civil','core-engineering',
 'Builds coordinated 3D building models that cut rework on large projects.',
 ARRAY['Create discipline-wise BIM models','Run clash detection between services','Extract quantities from models','Maintain BIM execution standards','Support 4D/5D planning'],
 ARRAY['Revit','Navisworks','AutoCAD','Clash detection','Quantity take-off'],
 ARRAY['Autodesk Revit Certified Professional','Navisworks Certification','buildingSMART BIM Professional'],
 3.0,7.5,11.0,26.0,'high','BIM Engineer to BIM Coordinator to BIM Manager'),

('power-systems-engineer','Power Systems Engineer','B.Tech','Electrical','core-engineering',
 'Plans and protects electrical networks from generation to distribution.',
 ARRAY['Perform load flow and short-circuit studies','Design protection and relay schemes','Prepare single line diagrams','Support substation commissioning','Ensure compliance with grid standards'],
 ARRAY['ETAP / PSCAD','Protection & switchgear','Electrical machines','IS/IEC standards','AutoCAD Electrical'],
 ARRAY['ETAP Certification','Certified Energy Manager (BEE)','IEEE Power Engineering Certificate'],
 3.0,7.5,11.0,26.0,'moderate','Power Engineer to Senior Engineer to Grid / Substation Manager'),

('ev-battery-engineer','EV & Battery Systems Engineer','B.Tech','Electrical','core-engineering',
 'Develops battery packs and management systems for India''s electric mobility push.',
 ARRAY['Design battery pack architecture','Develop and test BMS logic','Run thermal and safety validation','Analyse cell test and cycling data','Support AIS-156 compliance testing'],
 ARRAY['Battery management systems','Power electronics','MATLAB/Simulink','Thermal management','Testing & validation'],
 ARRAY['Electric Vehicle Technology (IIT NPTEL)','MATLAB/Simulink Certification','Functional Safety ISO 26262'],
 4.0,9.0,14.0,32.0,'high','Battery Engineer to Senior EV Engineer to EV Systems Lead'),

('process-engineer','Process Engineer','B.Tech','Chemical','core-engineering',
 'Designs and optimises chemical processes for yield, safety and cost.',
 ARRAY['Prepare mass and energy balances','Develop PFDs and P&IDs','Troubleshoot plant process deviations','Run process simulations','Support HAZOP and safety studies'],
 ARRAY['Aspen Plus / HYSYS','Heat & mass transfer','P&ID reading','Process safety','Data analysis'],
 ARRAY['Aspen HYSYS Certification','NEBOSH IGC','Six Sigma Green Belt'],
 3.5,8.0,12.0,28.0,'moderate','Process Engineer to Senior Process Engineer to Plant Technical Head'),

('quality-safety-engineer','Quality & Safety Engineer','B.Tech','Chemical','core-engineering',
 'Keeps plants compliant, safe and consistently within quality specifications.',
 ARRAY['Run quality inspections and audits','Investigate deviations and CAPA','Maintain ISO documentation','Conduct safety training and drills','Track quality KPIs'],
 ARRAY['QMS (ISO 9001)','Root cause analysis','Statistical process control','EHS regulations','Auditing'],
 ARRAY['ISO 9001 Lead Auditor','NEBOSH IGC','Six Sigma Black Belt'],
 3.0,7.0,10.0,24.0,'moderate','Quality Engineer to QA Manager to Plant Quality Head'),

('junior-software-developer','Junior Software Developer','BCA','Computer Applications','technology',
 'Entry route into software teams — builds features under mentorship and grows fast.',
 ARRAY['Implement small features and bug fixes','Write clean, reviewed code','Learn the codebase and team conventions','Write basic tests','Support releases and QA cycles'],
 ARRAY['Java / Python / JavaScript','SQL basics','Git','Problem solving','OOP fundamentals'],
 ARRAY['Oracle Certified Associate: Java','Microsoft Azure Fundamentals (AZ-900)','freeCodeCamp Full Stack Certification'],
 2.5,6.0,9.0,20.0,'high','Junior Developer to Software Engineer to Senior Engineer'),

('web-developer','Web Developer','BCA','Computer Applications','technology',
 'Builds and maintains websites and web apps for businesses and agencies.',
 ARRAY['Build responsive websites and landing pages','Integrate CMS and third-party APIs','Fix cross-browser and performance issues','Handle deployments and domains','Support SEO and analytics setup'],
 ARRAY['HTML, CSS, JavaScript','React or WordPress','REST APIs','Git','Basic SEO'],
 ARRAY['Meta Front-End Developer Certificate','Google Analytics Certification','W3C Front-End Developer'],
 2.5,6.5,9.0,20.0,'high','Web Developer to Senior Web Developer to Tech Lead'),

('it-support-analyst','IT Support / Systems Analyst','BCA','Computer Applications','infrastructure',
 'First line of defence for company IT — keeps people and systems productive.',
 ARRAY['Resolve hardware, software and access tickets','Manage user accounts and devices','Maintain IT asset inventory','Document SOPs and runbooks','Escalate and track major incidents'],
 ARRAY['Windows & Linux administration','Ticketing tools (Jira, ServiceNow)','Networking basics','Active Directory','Customer communication'],
 ARRAY['CompTIA A+','ITIL 4 Foundation','Microsoft 365 Certified: Fundamentals'],
 2.5,5.5,8.0,18.0,'moderate','IT Support to Systems Administrator to IT Manager'),

('business-analyst','Business Analyst','BBA','Management','business',
 'Bridge between business teams and technology — defines what should be built and why.',
 ARRAY['Gather and document business requirements','Map as-is and to-be processes','Write user stories and acceptance criteria','Run UAT with business users','Analyse data to support decisions'],
 ARRAY['Requirement gathering','SQL & Excel','Process mapping (BPMN)','Stakeholder communication','Agile / Scrum'],
 ARRAY['IIBA ECBA','Certified Scrum Product Owner (CSPO)','Google Data Analytics Certificate'],
 3.5,8.0,12.0,28.0,'high','Business Analyst to Senior BA to Product Manager / Consulting Manager'),

('digital-marketing-executive','Digital Marketing Executive','BBA','Management','business',
 'Grows brands online through search, social, content and paid campaigns.',
 ARRAY['Plan and run paid campaigns','Optimise website and content for SEO','Manage social channels and calendars','Track funnels and campaign ROI','Run email and lifecycle campaigns'],
 ARRAY['SEO & SEM','Google Ads & Meta Ads','Google Analytics 4','Content marketing','Marketing automation'],
 ARRAY['Google Ads Certification','Meta Certified Digital Marketing Associate','HubSpot Content Marketing'],
 2.5,6.0,9.0,22.0,'high','Executive to Digital Marketing Manager to Head of Growth'),

('hr-executive','HR Executive','BBA','Management','business',
 'Runs hiring, onboarding and employee experience for growing teams.',
 ARRAY['Source and screen candidates','Coordinate interviews and offers','Run onboarding and induction','Maintain HRMS records and policies','Support engagement and appraisal cycles'],
 ARRAY['Recruitment & sourcing','HRMS tools','Labour law basics','Communication','Employee engagement'],
 ARRAY['SHRM-CP','HR Analytics (Coursera)','LinkedIn Certified Recruiter'],
 2.5,5.5,8.0,20.0,'moderate','HR Executive to HR Business Partner to HR Manager / CHRO track'),

('sales-business-development','Sales & Business Development Executive','BBA','Management','business',
 'Finds customers, builds pipeline and closes revenue.',
 ARRAY['Prospect and qualify new leads','Run product demos and discovery calls','Negotiate and close deals','Maintain CRM hygiene and forecasts','Grow existing accounts'],
 ARRAY['CRM (Salesforce, HubSpot)','Negotiation','Market research','Presentation skills','Pipeline management'],
 ARRAY['HubSpot Sales Software Certification','Salesforce Certified Associate','SPIN Selling Certification'],
 2.5,7.0,10.0,30.0,'high','BD Executive to Account Manager to Sales Manager / Head of Sales'),

('financial-analyst','Financial Analyst','B.Com','Commerce','finance',
 'Analyses financial data to guide budgeting, forecasting and investment calls.',
 ARRAY['Build financial models and forecasts','Prepare MIS and variance reports','Analyse revenue, cost and margin trends','Support budgeting cycles','Present findings to management'],
 ARRAY['Advanced Excel','Financial modelling','Accounting fundamentals','Power BI','Valuation basics'],
 ARRAY['CFA Level I','NISM Series certifications','Financial Modelling & Valuation Analyst (FMVA)'],
 3.0,8.0,12.0,30.0,'high','Analyst to Senior Analyst to Finance Manager / FP&A Head'),

('accountant','Accountant','B.Com','Commerce','finance',
 'Keeps the books accurate and compliant with Indian tax and audit requirements.',
 ARRAY['Record and reconcile daily transactions','Prepare GST and TDS filings','Close monthly and yearly books','Handle vendor and customer ledgers','Support statutory audits'],
 ARRAY['Tally / Zoho Books','GST & TDS compliance','Accounting standards','Excel','Reconciliations'],
 ARRAY['Tally Certified Professional','GST Practitioner Certification','Certified Management Accountant (CMA)'],
 2.0,4.5,6.0,15.0,'moderate','Accountant to Senior Accountant to Finance Controller'),

('audit-associate','Audit & Assurance Associate','B.Com','Commerce','finance',
 'Reviews financial records and controls to confirm they are accurate and compliant.',
 ARRAY['Execute audit procedures and sampling','Test internal controls','Document working papers','Flag risks and control gaps','Support client reporting'],
 ARRAY['Auditing standards','Internal controls','Excel & data sampling','Report writing','Ethics & professional scepticism'],
 ARRAY['ACCA / CA Inter','Certified Internal Auditor (CIA)','ISO 9001 Internal Auditor'],
 2.5,6.0,9.0,24.0,'moderate','Audit Associate to Senior Associate to Audit Manager'),

('research-analyst-science','Research Analyst','B.Sc','Science','data',
 'Applies scientific and statistical methods to research questions in labs and industry.',
 ARRAY['Design and run experiments or studies','Collect and clean research data','Run statistical analysis','Write research reports and papers','Present findings to stakeholders'],
 ARRAY['Statistics','Python or R','Lab or field methods','Scientific writing','Data visualisation'],
 ARRAY['Google Data Analytics Certificate','R Programming (Johns Hopkins)','Good Laboratory Practice (GLP) Training'],
 2.5,6.0,9.0,22.0,'moderate','Research Analyst to Senior Researcher to Research Lead / PhD track');