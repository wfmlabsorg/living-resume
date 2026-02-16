#!/usr/bin/env bun

/**
 * Living Resume API — Interactive Profile Wizard
 *
 * Guides non-technical users through creating their professional profile.
 * Generates a valid TEMPLATE.md that the parser can read.
 *
 * Usage: bun run src/wizard/index.ts
 */

import * as p from '@clack/prompts';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import pc from 'picocolors';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WizardData {
  // About
  name: string;
  preferredName: string;
  title: string;
  location: string;
  coreThesis: string;
  theMoment: string;
  whatIOffer: Array<{ title: string; description: string }>;

  // Narrative
  professionalNarrative: string;
  philosophy: string;

  // Thesis Implications
  implications: string[];

  // Accomplishments
  financialImpact: Array<{ accomplishment: string; company: string; value: string }>;
  operationalScale: string[];
  recognition: string[];

  // Track Record
  headlineStats: Array<{ stat: string; context: string }>;

  // Experience
  experience: Array<{
    title: string;
    company: string;
    dates: string;
    location: string;
    description: string;
    contributions: string[];
  }>;

  // Seeking
  targetRoles: string[];
  reportingRelationship: string;
  organizationTypes: Array<{ type: string; whatIBring: string }>;
  industry: string;

  // Cultural Fit
  thriveIn: string[];
  notRightFor: string[];

  // Skills
  methodologies: string[];
  technical: string[];
  domain: string[];
}

// ─── Escape Hatch ────────────────────────────────────────────────────────────

/**
 * Offers the user a chance to break out and edit TEMPLATE.md directly.
 * Returns true if user chose to break out (template already saved), false to continue.
 */
async function offerEscapeHatch(
  data: Partial<WizardData>,
  completedSections: string[],
  remainingSections: string[]
): Promise<boolean> {
  const choice = await p.select({
    message: `You've completed: ${completedSections.join(', ')}.\n` +
             `  Remaining: ${remainingSections.join(', ')}.\n` +
             `  How do you want to continue?`,
    options: [
      { value: 'continue', label: 'Keep going with the wizard', hint: 'guided prompts for each section' },
      { value: 'breakout', label: "I'll edit TEMPLATE.md myself", hint: 'saves progress, you fill in the rest' },
    ]
  });

  if (p.isCancel(choice)) return true;

  if (choice === 'breakout') {
    const template = generateTemplateFromPartial(data);
    const outputPath = resolve(process.cwd(), 'TEMPLATE.md');
    writeFileSync(outputPath, template, 'utf-8');

    // Save profile-data.json so deploy can generate config
    if (data.name) {
      const profileDataPath = resolve(process.cwd(), 'profile-data.json');
      writeFileSync(profileDataPath, JSON.stringify({ name: data.name }, null, 2) + '\n');
    }

    p.outro(
      pc.green('✓ Progress saved to TEMPLATE.md') + '\n\n' +
      `Your answers are filled in. The remaining sections have examples\n` +
      `you can replace with your own content.\n\n` +
      `Sections to complete:\n` +
      remainingSections.map(s => `  ${pc.yellow('→')} ${s}`).join('\n') + '\n\n' +
      `Open ${pc.cyan('TEMPLATE.md')} in the editor (click it in the left sidebar)\n` +
      `and replace the ${pc.yellow('← REPLACE THIS')} placeholder text.\n\n` +
      `When you're done: ${pc.cyan('bun run deploy')}`
    );

    return true;
  }

  return false;
}

// ─── Main Wizard ─────────────────────────────────────────────────────────────

async function runWizard(): Promise<WizardData | null> {
  console.clear();

  p.intro(pc.cyan('Living Resume API — Profile Wizard'));

  const shouldContinue = await p.confirm({
    message: 'Welcome! This wizard helps you build your Living Resume API profile.\n' +
             '  You can complete every section here, or break out and edit the\n' +
             '  file directly at any checkpoint. Ready to start?',
    initialValue: true
  });

  if (p.isCancel(shouldContinue) || !shouldContinue) {
    p.cancel('Wizard cancelled.');
    return null;
  }

  const data: Partial<WizardData> = {};

  // ─── Step 1: Identity ────────────────────────────────────────────────────────

  p.note(
    'First, let\'s establish your professional identity.\n' +
    'Think of this as the structured version of "who are you?"',
    pc.cyan('Step 1: Identity')
  );

  data.name = await p.text({
    message: 'What is your full name?',
    placeholder: 'Jane Smith',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Name is required';
    }
  }) as string;

  if (p.isCancel(data.name)) return null;

  data.preferredName = await p.text({
    message: 'What do people call you?',
    placeholder: 'Jane',
    initialValue: data.name.split(' ')[0]
  }) as string;

  if (p.isCancel(data.preferredName)) return null;

  data.title = await p.text({
    message: 'What is your professional title?',
    placeholder: 'VP, Workforce Transformation',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Title is required';
    }
  }) as string;

  if (p.isCancel(data.title)) return null;

  data.location = await p.text({
    message: 'Where are you located?',
    placeholder: 'Chicago, IL',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Location is required';
    }
  }) as string;

  if (p.isCancel(data.location)) return null;

  // ─── Step 2: Professional Story ──────────────────────────────────────────────

  p.note(
    'Now let\'s capture your professional thesis and story.\n' +
    'This is what makes you unique — the big idea that drives your work.',
    pc.cyan('Step 2: Professional Story')
  );

  data.coreThesis = await p.text({
    message: 'What is your core professional thesis? (1-3 sentences)\n' +
             '  This is your big idea about how your industry should work.',
    placeholder: 'Organizations don\'t have to choose between cost efficiency and customer experience — ' +
                 'they can optimize for both through adaptive systems.',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Core thesis is required';
      if (value.length < 50) return 'Please provide more detail (at least 50 characters)';
    }
  }) as string;

  if (p.isCancel(data.coreThesis)) return null;

  data.theMoment = await p.text({
    message: 'What specific experience crystallized this thesis?\n' +
             '  Tell us about THE MOMENT when this clicked for you.',
    placeholder: 'When our ML forecasting model predicted a demand surge 72 hours before it happened ' +
                 'and we pre-positioned staff perfectly, I knew reactive workforce management was obsolete.',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'The moment is required';
      if (value.length < 50) return 'Please tell us the full story (at least 50 characters)';
    }
  }) as string;

  if (p.isCancel(data.theMoment)) return null;

  data.professionalNarrative = await p.text({
    message: 'Tell your career story in 1-2 paragraphs.\n' +
             '  Not a list of jobs — how does each chapter build on the last?',
    placeholder: 'My path from frontline operations to strategic consulting follows a single thread: ' +
                 'every role taught me that the gap between how organizations manage workforce and how they could is enormous...',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Professional narrative is required';
      if (value.length < 100) return 'Please provide more detail (at least 100 characters)';
    }
  }) as string;

  if (p.isCancel(data.professionalNarrative)) return null;

  data.philosophy = await p.text({
    message: 'What is your operating philosophy? (1-2 sentences)\n' +
             '  How do you approach work?',
    placeholder: 'Every operations problem is a prediction problem in disguise.',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Philosophy is required';
    }
  }) as string;

  if (p.isCancel(data.philosophy)) return null;

  // ─── Checkpoint 1 ──────────────────────────────────────────────────────────

  const breakout1 = await offerEscapeHatch(data,
    ['Identity', 'Professional Story'],
    ['What You Offer', 'Implications', 'Accomplishments', 'Track Record', 'Experience', 'Seeking', 'Cultural Fit', 'Skills']
  );
  if (breakout1) return null;

  // ─── Step 3: What You Offer ──────────────────────────────────────────────────

  p.note(
    'What are your core capabilities? List 2-4 areas where you deliver results.',
    pc.cyan('Step 3: What You Offer')
  );

  data.whatIOffer = [];

  for (let i = 0; i < 4; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another capability area? (${data.whatIOffer.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const title = await p.text({
      message: `Capability ${i + 1} — Title:`,
      placeholder: 'Workforce Transformation',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2 capabilities)';
      }
    }) as string;

    if (p.isCancel(title)) return null;
    if (!title || title.trim().length === 0) break;

    const description = await p.text({
      message: `Capability ${i + 1} — What do you deliver?`,
      placeholder: 'Modernize legacy WFM systems from reactive scheduling to AI-driven adaptive operations',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Description required';
      }
    }) as string;

    if (p.isCancel(description)) return null;

    data.whatIOffer.push({ title, description });
  }

  // ─── Step 4: Implications ────────────────────────────────────────────────────

  p.note(
    'What follows logically from your thesis? List 2-5 concrete implications.\n' +
    'These aren\'t goals — they\'re logical consequences of your worldview.',
    pc.cyan('Step 4: Thesis Implications')
  );

  data.implications = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another implication? (${data.implications.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const implication = await p.text({
      message: `Implication ${i + 1}:`,
      placeholder: 'Traditional Erlang-based forecasting is a 50-year-old solution to a modern problem',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2 implications)';
      }
    }) as string;

    if (p.isCancel(implication)) return null;
    if (!implication || implication.trim().length === 0) break;

    data.implications.push(implication);
  }

  // ─── Step 5: Accomplishments ─────────────────────────────────────────────────

  p.note(
    'Let\'s capture your quantified results. These are the proof points.',
    pc.cyan('Step 5: Accomplishments')
  );

  // Financial Impact
  const s = p.spinner();
  s.start('Financial impact...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s.stop('Financial impact');

  data.financialImpact = [];

  for (let i = 0; i < 5; i++) {
    if (i > 0) {
      const addAnother = await p.confirm({
        message: `Add another financial impact? (${data.financialImpact.length} so far)`,
        initialValue: i === 1
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const accomplishment = await p.text({
      message: `Financial Impact ${i + 1} — What did you do?`,
      placeholder: 'Reduced operational costs through workforce optimization',
      validate: (value) => {
        if (i === 0 && (!value || value.trim().length === 0)) return 'At least 1 required';
      }
    }) as string;

    if (p.isCancel(accomplishment)) return null;
    if (!accomplishment || accomplishment.trim().length === 0) break;

    const company = await p.text({
      message: `Financial Impact ${i + 1} — Where?`,
      placeholder: 'Acme Corp',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Company required';
      }
    }) as string;

    if (p.isCancel(company)) return null;

    const value = await p.text({
      message: `Financial Impact ${i + 1} — Value?`,
      placeholder: '$5M annual savings',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Value required';
      }
    }) as string;

    if (p.isCancel(value)) return null;

    data.financialImpact.push({ accomplishment, company, value });
  }

  // Operational Scale
  s.start('Operational scale...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s.stop('Operational scale');

  data.operationalScale = [];

  for (let i = 0; i < 5; i++) {
    if (i > 0) {
      const addAnother = await p.confirm({
        message: `Add another scale metric? (${data.operationalScale.length} so far)`,
        initialValue: i === 1
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const scale = await p.text({
      message: `Operational Scale ${i + 1}:`,
      placeholder: 'Managed 5,000 agents across 8 contact centers',
      validate: (value) => {
        if (i === 0 && (!value || value.trim().length === 0)) return 'At least 1 required';
      }
    }) as string;

    if (p.isCancel(scale)) return null;
    if (!scale || scale.trim().length === 0) break;

    data.operationalScale.push(scale);
  }

  // Recognition & Innovation
  s.start('Recognition & innovation...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s.stop('Recognition & innovation');

  data.recognition = [];

  const addRecognition = await p.confirm({
    message: 'Do you have any awards, certifications, publications, or speaking engagements?',
    initialValue: true
  });

  if (p.isCancel(addRecognition)) return null;

  if (addRecognition) {
    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        const addAnother = await p.confirm({
          message: `Add another recognition? (${data.recognition.length} so far)`,
          initialValue: false
        });

        if (p.isCancel(addAnother) || !addAnother) break;
      }

      const item = await p.text({
        message: `Recognition ${i + 1}:`,
        placeholder: 'Six Sigma Black Belt Certification',
      }) as string;

      if (p.isCancel(item)) return null;
      if (!item || item.trim().length === 0) break;

      data.recognition.push(item);
    }
  }

  // ─── Checkpoint 2 ──────────────────────────────────────────────────────────

  const breakout2 = await offerEscapeHatch(data,
    ['Identity', 'Story', 'Capabilities', 'Implications', 'Accomplishments'],
    ['Track Record', 'Experience', 'Seeking', 'Cultural Fit', 'Skills']
  );
  if (breakout2) return null;

  // ─── Step 6: Track Record ────────────────────────────────────────────────────

  p.note(
    'What are your headline stats? The numbers on the back of your baseball card.',
    pc.cyan('Step 6: Track Record')
  );

  data.headlineStats = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another headline stat? (${data.headlineStats.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const stat = await p.text({
      message: `Headline Stat ${i + 1} — The number:`,
      placeholder: '$50M+',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2 stats)';
      }
    }) as string;

    if (p.isCancel(stat)) return null;
    if (!stat || stat.trim().length === 0) break;

    const context = await p.text({
      message: `Headline Stat ${i + 1} — Context:`,
      placeholder: 'Total documented cost savings across career',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Context required';
      }
    }) as string;

    if (p.isCancel(context)) return null;

    data.headlineStats.push({ stat, context });
  }

  // ─── Step 7: Experience ──────────────────────────────────────────────────────

  p.note(
    'Now let\'s walk through your role history. We\'ll capture 1-5 roles.',
    pc.cyan('Step 7: Experience')
  );

  data.experience = [];

  for (let i = 0; i < 5; i++) {
    if (i > 0) {
      const addAnother = await p.confirm({
        message: `Add another role? (${data.experience.length} so far)`,
        initialValue: i === 1
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    p.log.info(`Role ${i + 1}${i === 0 ? ' (most recent)' : ''}`);

    const roleTitle = await p.text({
      message: 'Title:',
      placeholder: 'Vice President, Business Transformation',
      validate: (value) => {
        if (i === 0 && (!value || value.trim().length === 0)) return 'At least 1 role required';
      }
    }) as string;

    if (p.isCancel(roleTitle)) return null;
    if (!roleTitle || roleTitle.trim().length === 0) break;

    const company = await p.text({
      message: 'Company:',
      placeholder: 'Acme Corp',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Company required';
      }
    }) as string;

    if (p.isCancel(company)) return null;

    const dates = await p.text({
      message: 'Dates:',
      placeholder: '2021 - Present',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Dates required';
      }
    }) as string;

    if (p.isCancel(dates)) return null;

    const roleLocation = await p.text({
      message: 'Location:',
      placeholder: 'Chicago, IL',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Location required';
      }
    }) as string;

    if (p.isCancel(roleLocation)) return null;

    const description = await p.text({
      message: 'Role description (1-2 sentences):',
      placeholder: 'Led enterprise-wide workforce transformation initiative...',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Description required';
      }
    }) as string;

    if (p.isCancel(description)) return null;

    // Contributions
    const contributions: string[] = [];

    for (let j = 0; j < 5; j++) {
      if (j > 1) {
        const addContribution = await p.confirm({
          message: `Add another contribution? (${contributions.length} so far)`,
          initialValue: false
        });

        if (p.isCancel(addContribution) || !addContribution) break;
      }

      const contribution = await p.text({
        message: `Key contribution ${j + 1}:`,
        placeholder: 'Reduced operational costs by $5M through workforce optimization',
        validate: (value) => {
          if (j < 2 && (!value || value.trim().length === 0)) return 'At least 2 contributions required';
        }
      }) as string;

      if (p.isCancel(contribution)) return null;
      if (!contribution || contribution.trim().length === 0) break;

      contributions.push(contribution);
    }

    data.experience.push({
      title: roleTitle,
      company,
      dates,
      location: roleLocation,
      description,
      contributions
    });
  }

  // ─── Step 8: What You're Seeking ─────────────────────────────────────────────

  p.note(
    'What are you looking for? Be specific about roles and organizations.',
    pc.cyan('Step 8: What You\'re Seeking')
  );

  data.targetRoles = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another target role? (${data.targetRoles.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const role = await p.text({
      message: `Target Role ${i + 1}:`,
      placeholder: 'VP, Workforce Transformation',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2 roles)';
      }
    }) as string;

    if (p.isCancel(role)) return null;
    if (!role || role.trim().length === 0) break;

    data.targetRoles.push(role);
  }

  data.reportingRelationship = await p.text({
    message: 'Who do you expect to report to?',
    placeholder: 'Reports to COO, CTO, or CEO in transformation-focused organization',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Reporting relationship required';
    }
  }) as string;

  if (p.isCancel(data.reportingRelationship)) return null;

  data.organizationTypes = [];

  for (let i = 0; i < 3; i++) {
    if (i > 0) {
      const addAnother = await p.confirm({
        message: `Add another organization type? (${data.organizationTypes.length} so far)`,
        initialValue: i === 1
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const type = await p.text({
      message: `Organization Type ${i + 1}:`,
      placeholder: 'Fortune 500 with transformation mandate',
      validate: (value) => {
        if (i === 0 && (!value || value.trim().length === 0)) return 'At least 1 required';
      }
    }) as string;

    if (p.isCancel(type)) return null;
    if (!type || type.trim().length === 0) break;

    const whatIBring = await p.text({
      message: `What you bring to ${type}:`,
      placeholder: 'Proven ability to drive $50M+ in operational savings at enterprise scale',
      validate: (value) => {
        if (!value || value.trim().length === 0) return 'Required';
      }
    }) as string;

    if (p.isCancel(whatIBring)) return null;

    data.organizationTypes.push({ type, whatIBring });
  }

  data.industry = await p.text({
    message: 'What industries are you targeting?',
    placeholder: 'Financial Services, Healthcare, Technology',
    validate: (value) => {
      if (!value || value.trim().length === 0) return 'Industry required';
    }
  }) as string;

  if (p.isCancel(data.industry)) return null;

  // ─── Step 9: Cultural Fit ────────────────────────────────────────────────────

  p.note(
    'Cultural fit is critical. Be honest about where you thrive AND where you don\'t.',
    pc.cyan('Step 9: Cultural Fit')
  );

  data.thriveIn = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another "thrive in" environment? (${data.thriveIn.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const env = await p.text({
      message: `I thrive in ${i + 1}:`,
      placeholder: 'Innovation-oriented cultures that encourage experimentation',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2)';
      }
    }) as string;

    if (p.isCancel(env)) return null;
    if (!env || env.trim().length === 0) break;

    data.thriveIn.push(env);
  }

  data.notRightFor = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another "not right for" environment? (${data.notRightFor.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const env = await p.text({
      message: `Not right for ${i + 1}:`,
      placeholder: 'Organizations that want to maintain status quo with incremental improvements',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2)';
      }
    }) as string;

    if (p.isCancel(env)) return null;
    if (!env || env.trim().length === 0) break;

    data.notRightFor.push(env);
  }

  // ─── Step 10: Skills ─────────────────────────────────────────────────────────

  p.note(
    'Finally, let\'s capture your skills inventory across 3 categories.',
    pc.cyan('Step 10: Skills')
  );

  // Methodologies
  const s2 = p.spinner();
  s2.start('Methodologies...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s2.stop('Methodologies');

  data.methodologies = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another methodology? (${data.methodologies.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const methodology = await p.text({
      message: `Methodology ${i + 1}:`,
      placeholder: 'Six Sigma (Black Belt)',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2)';
      }
    }) as string;

    if (p.isCancel(methodology)) return null;
    if (!methodology || methodology.trim().length === 0) break;

    data.methodologies.push(methodology);
  }

  // Technical
  s2.start('Technical skills...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s2.stop('Technical skills');

  data.technical = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another technical skill? (${data.technical.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const tech = await p.text({
      message: `Technical Skill ${i + 1}:`,
      placeholder: 'Python (scikit-learn, TensorFlow)',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2)';
      }
    }) as string;

    if (p.isCancel(tech)) return null;
    if (!tech || tech.trim().length === 0) break;

    data.technical.push(tech);
  }

  // Domain Expertise
  s2.start('Domain expertise...');
  await new Promise(resolve => setTimeout(resolve, 500));
  s2.stop('Domain expertise');

  data.domain = [];

  for (let i = 0; i < 5; i++) {
    if (i > 1) {
      const addAnother = await p.confirm({
        message: `Add another domain expertise? (${data.domain.length} so far)`,
        initialValue: i === 2
      });

      if (p.isCancel(addAnother) || !addAnother) break;
    }

    const domain = await p.text({
      message: `Domain Expertise ${i + 1}:`,
      placeholder: 'Demand Forecasting',
      validate: (value) => {
        if (i < 2 && (!value || value.trim().length === 0)) return 'Required (at least 2)';
      }
    }) as string;

    if (p.isCancel(domain)) return null;
    if (!domain || domain.trim().length === 0) break;

    data.domain.push(domain);
  }

  return data as WizardData;
}

// ─── Generate Partial TEMPLATE.md (for escape hatch) ─────────────────────────

const PH = '← REPLACE THIS'; // placeholder marker

function generateTemplateFromPartial(data: Partial<WizardData>): string {
  let t = '';

  t += '# Living Resume API — Your Professional Profile\n\n';
  t += '> Your wizard answers are filled in below. Replace any "← REPLACE THIS"\n';
  t += '> placeholder with your own content, then run: bun run deploy\n\n';
  t += '---\n\n';

  // About
  t += '## About\n\n';
  t += `**Name:** ${data.name || `Your Name ${PH}`}\n\n`;
  t += `**Preferred Name:** ${data.preferredName || `Your Nickname ${PH}`}\n\n`;
  t += `**Title:** ${data.title || `VP, Your Specialty ${PH}`}\n\n`;
  t += `**Location:** ${data.location || `City, State ${PH}`}\n\n`;
  t += `**Core Thesis:**\n${data.coreThesis || `Your big idea about how your industry should work. ${PH}`}\n\n`;
  t += `**The Moment:**\n${data.theMoment || `The experience that crystallized your thesis. ${PH}`}\n\n`;
  t += '### What I Offer\n\n';
  if (data.whatIOffer && data.whatIOffer.length > 0) {
    for (const item of data.whatIOffer) {
      t += `- **Title:** ${item.title}\n`;
      t += `  **Description:** ${item.description}\n\n`;
    }
  } else {
    t += `- **Title:** Capability Area 1 ${PH}\n`;
    t += `  **Description:** What you deliver in this area ${PH}\n\n`;
    t += `- **Title:** Capability Area 2 ${PH}\n`;
    t += `  **Description:** What you deliver in this area ${PH}\n\n`;
  }
  t += '---\n\n';

  // Narrative
  t += '## Narrative\n\n';
  t += `**Professional Narrative:**\n${data.professionalNarrative || `Your career story in 1-2 paragraphs. Not a list of jobs — how does each chapter build on the last? ${PH}`}\n\n`;
  t += `**Philosophy:**\n${data.philosophy || `Your operating philosophy in 1-2 sentences. ${PH}`}\n\n`;
  t += '---\n\n';

  // Thesis
  t += '## Thesis\n\n';
  t += `**Core Thesis:**\n${data.coreThesis || `Same as About section. ${PH}`}\n\n`;
  t += `**The Moment:**\n${data.theMoment || `Same as About section. ${PH}`}\n\n`;
  t += '### Implications\n\n';
  if (data.implications && data.implications.length > 0) {
    for (const imp of data.implications) t += `- ${imp}\n`;
  } else {
    t += `- What follows logically from your thesis — implication 1 ${PH}\n`;
    t += `- Another logical consequence of your worldview ${PH}\n`;
  }
  t += '\n---\n\n';

  // Accomplishments
  t += '## Accomplishments\n\n';
  t += '### Financial Impact\n\n';
  t += '| Accomplishment | Company | Value |\n';
  t += '|----------------|---------|-------|\n';
  if (data.financialImpact && data.financialImpact.length > 0) {
    for (const item of data.financialImpact) {
      t += `| ${item.accomplishment} | ${item.company} | ${item.value} |\n`;
    }
  } else {
    t += `| What you did ${PH} | Company Name ${PH} | $X savings ${PH} |\n`;
  }
  t += '\n### Operational Scale\n\n';
  if (data.operationalScale && data.operationalScale.length > 0) {
    for (const item of data.operationalScale) t += `- ${item}\n`;
  } else {
    t += `- Scale metric, e.g. "Managed 5,000 agents across 8 centers" ${PH}\n`;
  }
  t += '\n### Recognition & Innovation\n\n';
  if (data.recognition && data.recognition.length > 0) {
    for (const item of data.recognition) t += `- ${item}\n`;
  } else {
    t += `- Awards, certifications, or publications ${PH}\n`;
  }
  t += '\n---\n\n';

  // Track Record
  t += '## Track Record\n\n';
  t += '### Headline Stats\n\n';
  t += '| Stat | Context |\n';
  t += '|------|---------|\n';
  if (data.headlineStats && data.headlineStats.length > 0) {
    for (const item of data.headlineStats) {
      t += `| ${item.stat} | ${item.context} |\n`;
    }
  } else {
    t += `| $50M+ ${PH} | Total documented cost savings ${PH} |\n`;
    t += `| 20+ years ${PH} | Industry experience ${PH} |\n`;
  }
  t += '\n---\n\n';

  // Experience
  t += '## Experience\n\n';
  if (data.experience && data.experience.length > 0) {
    for (let i = 0; i < data.experience.length; i++) {
      const role = data.experience[i];
      t += `### Role ${i + 1}${i === 0 ? ' (Most Recent)' : ''}\n\n`;
      t += `- **Title:** ${role.title}\n`;
      t += `- **Company:** ${role.company}\n`;
      t += `- **Dates:** ${role.dates}\n`;
      t += `- **Location:** ${role.location}\n`;
      t += `- **Description:** ${role.description}\n`;
      t += '- **Key Contributions:**\n';
      for (const c of role.contributions) t += `  - ${c}\n`;
      t += '\n';
    }
  } else {
    t += `### Role 1 (Most Recent)\n\n`;
    t += `- **Title:** Your Title ${PH}\n`;
    t += `- **Company:** Company Name ${PH}\n`;
    t += `- **Dates:** 2021 - Present ${PH}\n`;
    t += `- **Location:** City, State ${PH}\n`;
    t += `- **Description:** What you did in this role ${PH}\n`;
    t += `- **Key Contributions:**\n`;
    t += `  - Key achievement or contribution ${PH}\n`;
    t += `  - Another key contribution ${PH}\n\n`;
  }
  t += '---\n\n';

  // Seeking
  t += '## Seeking\n\n';
  t += '**Target Roles:**\n';
  if (data.targetRoles && data.targetRoles.length > 0) {
    for (const role of data.targetRoles) t += `- ${role}\n`;
  } else {
    t += `- VP, Your Specialty ${PH}\n`;
    t += `- Another target title ${PH}\n`;
  }
  t += `\n**Reporting Relationship:**\n${data.reportingRelationship || `Who you expect to report to ${PH}`}\n\n`;
  t += '### Organization Types\n\n';
  t += '| Organization Type | What I Bring |\n';
  t += '|-------------------|--------------|\n';
  if (data.organizationTypes && data.organizationTypes.length > 0) {
    for (const org of data.organizationTypes) {
      t += `| ${org.type} | ${org.whatIBring} |\n`;
    }
  } else {
    t += `| Fortune 500 ${PH} | What you bring to this type ${PH} |\n`;
  }
  t += `\n**Industry:**\n${data.industry || `Target industries ${PH}`}\n\n`;
  t += '---\n\n';

  // Cultural Fit
  t += '## Cultural Fit\n\n';
  t += '### I Thrive In\n\n';
  if (data.thriveIn && data.thriveIn.length > 0) {
    for (const env of data.thriveIn) t += `- ${env}\n`;
  } else {
    t += `- Environments where you do your best work ${PH}\n`;
    t += `- Another environment trait ${PH}\n`;
  }
  t += '\n### Not Right For\n\n';
  if (data.notRightFor && data.notRightFor.length > 0) {
    for (const env of data.notRightFor) t += `- ${env}\n`;
  } else {
    t += `- Environments that aren't a good match ${PH}\n`;
    t += `- Another environment to avoid ${PH}\n`;
  }
  t += '\n---\n\n';

  // Skills
  t += '## Skills\n\n';
  t += '### Methodologies\n\n';
  if (data.methodologies && data.methodologies.length > 0) {
    for (const m of data.methodologies) t += `- ${m}\n`;
  } else {
    t += `- Six Sigma, Lean, etc. ${PH}\n`;
  }
  t += '\n### Technical\n\n';
  if (data.technical && data.technical.length > 0) {
    for (const tech of data.technical) t += `- ${tech}\n`;
  } else {
    t += `- Tools, languages, platforms ${PH}\n`;
  }
  t += '\n### Domain Expertise\n\n';
  if (data.domain && data.domain.length > 0) {
    for (const d of data.domain) t += `- ${d}\n`;
  } else {
    t += `- Your areas of deep knowledge ${PH}\n`;
  }
  t += '\n';

  return t;
}

// ─── Generate TEMPLATE.md ────────────────────────────────────────────────────

function generateTemplate(data: WizardData): string {
  let template = '';

  template += '# Living Resume API — Your Professional Profile\n\n';
  template += '> Fill in each section below. This file becomes your Living Resume API.\n';
  template += '> Every section maps directly to an API endpoint that machines, recruiters,\n';
  template += '> and AI agents can query about you.\n\n';
  template += '---\n\n';

  // About
  template += '## About\n\n';
  template += `**Name:** ${data.name}\n\n`;
  template += `**Preferred Name:** ${data.preferredName}\n\n`;
  template += `**Title:** ${data.title}\n\n`;
  template += `**Location:** ${data.location}\n\n`;
  template += `**Core Thesis:**\n${data.coreThesis}\n\n`;
  template += `**The Moment:**\n${data.theMoment}\n\n`;
  template += '### What I Offer\n\n';

  for (const item of data.whatIOffer) {
    template += `- **Title:** ${item.title}\n`;
    template += `  **Description:** ${item.description}\n\n`;
  }

  template += '---\n\n';

  // Narrative
  template += '## Narrative\n\n';
  template += `**Professional Narrative:**\n${data.professionalNarrative}\n\n`;
  template += `**Philosophy:**\n${data.philosophy}\n\n`;
  template += '---\n\n';

  // Thesis
  template += '## Thesis\n\n';
  template += `**Core Thesis:**\n${data.coreThesis}\n\n`;
  template += `**The Moment:**\n${data.theMoment}\n\n`;
  template += '### Implications\n\n';

  for (const implication of data.implications) {
    template += `- ${implication}\n`;
  }

  template += '\n---\n\n';

  // Accomplishments
  template += '## Accomplishments\n\n';
  template += '### Financial Impact\n\n';
  template += '| Accomplishment | Company | Value |\n';
  template += '|----------------|---------|-------|\n';

  for (const item of data.financialImpact) {
    template += `| ${item.accomplishment} | ${item.company} | ${item.value} |\n`;
  }

  template += '\n### Operational Scale\n\n';

  for (const item of data.operationalScale) {
    template += `- ${item}\n`;
  }

  template += '\n### Recognition & Innovation\n\n';

  if (data.recognition.length > 0) {
    for (const item of data.recognition) {
      template += `- ${item}\n`;
    }
  } else {
    template += '- <!-- Add recognition items if applicable -->\n';
  }

  template += '\n---\n\n';

  // Track Record
  template += '## Track Record\n\n';
  template += '### Headline Stats\n\n';
  template += '| Stat | Context |\n';
  template += '|------|---------|\n';

  for (const item of data.headlineStats) {
    template += `| ${item.stat} | ${item.context} |\n`;
  }

  template += '\n---\n\n';

  // Experience
  template += '## Experience\n\n';

  for (let i = 0; i < data.experience.length; i++) {
    const role = data.experience[i];
    template += `### Role ${i + 1}${i === 0 ? ' (Most Recent)' : ''}\n\n`;
    template += `- **Title:** ${role.title}\n`;
    template += `- **Company:** ${role.company}\n`;
    template += `- **Dates:** ${role.dates}\n`;
    template += `- **Location:** ${role.location}\n`;
    template += `- **Description:** ${role.description}\n`;
    template += '- **Key Contributions:**\n';

    for (const contribution of role.contributions) {
      template += `  - ${contribution}\n`;
    }

    template += '\n';
  }

  template += '---\n\n';

  // Seeking
  template += '## Seeking\n\n';
  template += '**Target Roles:**\n';

  for (const role of data.targetRoles) {
    template += `- ${role}\n`;
  }

  template += `\n**Reporting Relationship:**\n${data.reportingRelationship}\n\n`;
  template += '### Organization Types\n\n';
  template += '| Organization Type | What I Bring |\n';
  template += '|-------------------|--------------|\n';

  for (const org of data.organizationTypes) {
    template += `| ${org.type} | ${org.whatIBring} |\n`;
  }

  template += `\n**Industry:**\n${data.industry}\n\n`;
  template += '---\n\n';

  // Cultural Fit
  template += '## Cultural Fit\n\n';
  template += '### I Thrive In\n\n';

  for (const env of data.thriveIn) {
    template += `- ${env}\n`;
  }

  template += '\n### Not Right For\n\n';

  for (const env of data.notRightFor) {
    template += `- ${env}\n`;
  }

  template += '\n---\n\n';

  // Skills
  template += '## Skills\n\n';
  template += '### Methodologies\n\n';

  for (const method of data.methodologies) {
    template += `- ${method}\n`;
  }

  template += '\n### Technical\n\n';

  for (const tech of data.technical) {
    template += `- ${tech}\n`;
  }

  template += '\n### Domain Expertise\n\n';

  for (const domain of data.domain) {
    template += `- ${domain}\n`;
  }

  template += '\n';

  return template;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const data = await runWizard();

  if (!data) {
    process.exit(0);
  }

  // Show summary
  console.log('');
  p.note(
    `${pc.cyan('Profile Summary')}\n\n` +
    `${pc.bold('Identity:')} ${data.name} — ${data.title}\n` +
    `${pc.bold('Location:')} ${data.location}\n` +
    `${pc.bold('Capabilities:')} ${data.whatIOffer.length} areas\n` +
    `${pc.bold('Experience:')} ${data.experience.length} roles\n` +
    `${pc.bold('Financial Impact:')} ${data.financialImpact.length} accomplishments\n` +
    `${pc.bold('Target Roles:')} ${data.targetRoles.length} roles\n` +
    `${pc.bold('Skills:')} ${data.methodologies.length + data.technical.length + data.domain.length} total`,
    pc.green('✓ Profile Complete')
  );

  const shouldGenerate = await p.confirm({
    message: 'Generate TEMPLATE.md now?',
    initialValue: true
  });

  if (p.isCancel(shouldGenerate) || !shouldGenerate) {
    p.cancel('Skipped TEMPLATE.md generation.');
    process.exit(0);
  }

  // Generate template
  const template = generateTemplate(data);
  const outputPath = resolve(process.cwd(), 'TEMPLATE.md');

  writeFileSync(outputPath, template, 'utf-8');

  // Also save profile-data.json for deploy's config generation
  const profileDataPath = resolve(process.cwd(), 'profile-data.json');
  writeFileSync(profileDataPath, JSON.stringify({ name: data.name }, null, 2) + '\n');

  p.outro(
    pc.green('✓ Success!') + '\n\n' +
    `Your Living Resume profile has been generated:\n` +
    `${pc.cyan(outputPath)}\n\n` +
    `Next steps:\n` +
    `1. Review and edit TEMPLATE.md if needed\n` +
    `2. Run: ${pc.cyan('bun run deploy')} — builds and publishes your API\n\n` +
    `${pc.dim('Tip: You can always edit TEMPLATE.md later and re-deploy.')}`
  );
}

main().catch(console.error);
