import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const info = [
  {
    icon: 'microscope',
    title: 'Screening Procedures',
    items: [
      {
        name: 'Pap Smear (Pap Test)',
        desc: 'Collects cervical cells to check for abnormalities. Recommended every 3-5 years for women 25-49.',
        cost: 'KES 500 - 2,000 (govt) / KES 2,000 - 5,000 (private)',
        time: '10-15 minutes',
      },
      {
        name: 'HPV DNA Test',
        desc: 'Detects high-risk HPV types directly. More sensitive than Pap smear. Can be done on self-collected samples.',
        cost: 'KES 1,500 - 4,000',
        time: 'Same as Pap smear',
      },
      {
        name: 'VIA (Visual Inspection with Acetic Acid)',
        desc: 'Vinegar solution applied to cervix — abnormal areas turn white. Quick, low-cost, used in low-resource settings.',
        cost: 'KES 200 - 500',
        time: '5-10 minutes',
      },
      {
        name: 'Colposcopy',
        desc: 'Follow-up if Pap/HPV is abnormal. Uses a special microscope to examine the cervix closely.',
        cost: 'KES 3,000 - 8,000',
        time: '15-20 minutes',
      },
      {
        name: 'Cervical Biopsy',
        desc: 'Small tissue sample taken during colposcopy if abnormal areas are seen. Sent to lab for analysis.',
        cost: 'KES 5,000 - 15,000',
        time: '10 minutes',
      },
    ],
  },
  {
    icon: 'hospital-building',
    title: 'Where to Get Screened in Kenya',
    items: [
      {
        name: 'Kenyatta National Hospital (Nairobi)',
        desc: 'National referral hospital. Full cervical cancer screening and treatment services.',
        contact: '+254 20 2726300',
      },
      {
        name: 'Moi Teaching & Referral Hospital (Eldoret)',
        desc: 'Major referral hospital in western Kenya. Screening, colposcopy, and treatment.',
        contact: '+254 20 3666000',
      },
      {
        name: 'Coast General Hospital (Mombasa)',
        desc: 'Coastal region referral. Screening, vaccination, and treatment services.',
        contact: '+254 20 4291000',
      },
      {
        name: 'Marie Stopes Kenya (Multiple locations)',
        desc: 'Offers cervical screening at affordable rates. Nairobi, Mombasa, Kisumu, Nakuru, and more.',
        contact: '+254 719 054000',
      },
      {
        name: 'Family Health Options Kenya (FHOK)',
        desc: 'Reproductive health services including cervical screening in several counties.',
        contact: '+254 20 2724722',
      },
      {
        name: 'Level 4 & 5 County Hospitals',
        desc: 'Most county hospitals offer VIA and Pap smear at subsidized rates.',
      },
    ],
  },
  {
    icon: 'shield-check',
    title: 'What to Expect',
    items: [
      {
        name: 'Before the Test',
        desc: 'Avoid intercourse, douching, or vaginal products for 48 hours before. Don\'t schedule during your period. Empty your bladder before the exam.',
      },
      {
        name: 'During the Test',
        desc: 'You\'ll undress from the waist down and lie on an exam table with knees bent. A speculum gently opens the vagina. The doctor uses a small brush to collect cells. You may feel mild pressure but it\'s usually painless.',
      },
      {
        name: 'After the Test',
        desc: 'You can resume normal activities immediately. Some women have very light spotting. Results take 1-3 weeks.',
      },
      {
        name: 'Understanding Results',
        desc: 'Normal: No abnormal cells found. Abnormal: May need follow-up — doesn\'t mean cancer. Unsatisfactory: Sample wasn\'t good enough, repeat needed.',
      },
    ],
  },
  {
    icon: 'lightbulb-on',
    title: 'Tips & Reminders',
    items: [
      {
        name: 'Screening saves lives',
        desc: 'Up to 80% of cervical cancers can be prevented with regular screening.',
      },
      {
        name: 'Start at age 25',
        desc: 'WHO recommends screening from age 25 (or 30 depending on country guidelines).',
      },
      {
        name: 'Screen every 3-5 years',
        desc: 'If results are normal, every 3-5 years is sufficient. More often if abnormal.',
      },
      {
        name: 'Even if vaccinated',
        desc: 'The HPV vaccine doesn\'t cover all cancer-causing types. Vaccinated women still need regular screening.',
      },
      {
        name: 'No symptoms needed',
        desc: 'Early cervical cancer has no symptoms. Don\'t wait for symptoms to get screened.',
      },
    ],
  },
];

export default function ScreeningInfoScreen() {
  const { colors } = useTheme();
  const s = styles(colors);

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      <Text style={s.screenTitle}>Screening Information</Text>
      <Text style={s.screenSub}>Everything you need to know about cervical screening in Kenya</Text>

      {info.map((section, si) => (
        <View key={si} style={s.section}>
          <View style={s.sectionHeader}>
            <MaterialCommunityIcons name={section.icon as any} size={22} color={colors.primary} />
            <Text style={s.sectionTitle}>{section.title}</Text>
          </View>
          {section.items.map((item, ii) => (
            <View key={ii} style={s.card}>
              <Text style={s.cardTitle}>{item.name}</Text>
              <Text style={s.cardDesc}>{item.desc}</Text>
              {'cost' in item && item.cost ? (
                <View style={s.metaRow}>
                  <MaterialCommunityIcons name="cash" size={14} color={colors.textSecondary} />
                  <Text style={s.metaText}>{item.cost}</Text>
                </View>
              ) : null}
              {'time' in item && item.time ? (
                <View style={s.metaRow}>
                  <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
                  <Text style={s.metaText}>{item.time}</Text>
                </View>
              ) : null}
              {'contact' in item && item.contact ? (
                <View style={s.metaRow}>
                  <MaterialCommunityIcons name="phone" size={14} color={colors.textSecondary} />
                  <Text style={s.metaText}>{item.contact}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg,
      paddingHorizontal: 16,
      paddingTop: 60,
    },
    screenTitle: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
    },
    screenSub: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 4,
      marginBottom: 20,
    },
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.text,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 4,
    },
    cardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
    },
    metaText: {
      fontSize: 12,
      color: colors.textSecondary,
    },
  });
