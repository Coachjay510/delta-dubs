// ── useSport.js ──
// Central config for all supported sports.
// Every sport-specific behavior in the app reads from here.

export const SPORTS = [
  { id: 'basketball', label: 'Basketball', icon: '🏀' },
  { id: 'football',   label: 'Football',   icon: '🏈' },
  { id: 'baseball',   label: 'Baseball',   icon: '⚾' },
  { id: 'softball',   label: 'Softball',   icon: '🥎' },
  { id: 'soccer',     label: 'Soccer',     icon: '⚽' },
  { id: 'volleyball', label: 'Volleyball', icon: '🏐' },
]

const SPORT_CONFIG = {

  basketball: {
    label: 'Basketball',
    icon: '🏀',
    teamSize: { min: 5, max: 15 },
    periods: [
      { id: 'quarters', label: 'Quarters (4)', count: 4 },
      { id: 'halves',   label: 'Halves (2)',   count: 2 },
    ],
    defaultPeriodType: 'quarters',
    periodLabel: (n, type) => type === 'halves' ? `H${n}` : `Q${n}`,
    positions: ['PG','SG','SF','PF','C'],
    ageGroups: ['8U','9U','10U','11U','12U','13U','14U','15U','16U','17U','18U','Varsity','JV'],
    statCategories: [
      { id:'2pt_made',  label:'2pt ✓',    color:'green', group:'shooting' },
      { id:'2pt_miss',  label:'2pt ✗',    color:'red',   group:'shooting' },
      { id:'3pt_made',  label:'3pt ✓',    color:'green', group:'shooting' },
      { id:'3pt_miss',  label:'3pt ✗',    color:'red',   group:'shooting' },
      { id:'ft_made',   label:'FT ✓',     color:'green', group:'shooting' },
      { id:'ft_miss',   label:'FT ✗',     color:'red',   group:'shooting' },
      { id:'reb_off',   label:'Off Reb',  color:'blue',  group:'other' },
      { id:'reb_def',   label:'Def Reb',  color:'blue',  group:'other' },
      { id:'ast',       label:'Assist',   color:'blue',  group:'other' },
      { id:'stl',       label:'Steal',    color:'blue',  group:'other' },
      { id:'blk',       label:'Block',    color:'blue',  group:'other' },
      { id:'tov',       label:'Tov',      color:'amber', group:'other' },
      { id:'foul',      label:'Foul',     color:'amber', group:'other' },
    ],
    boxScoreStats: ['pts','reb','ast','stl','blk','tov','fgm','fga','p3m','p3a','ftm','fta','min'],
    statLabels: { pts:'PTS',reb:'REB',ast:'AST',stl:'STL',blk:'BLK',tov:'TOV',
                  fgm:'FGM',fga:'FGA',p3m:'3PM',p3a:'3PA',ftm:'FTM',fta:'FTA',min:'MIN' },
    fieldType: 'basketball_court',
    hasOpponentShots: true,
    scoringUnit: 'points',
  },

  football: {
    label: 'Football',
    icon: '🏈',
    teamSize: { min: 11, max: 53 },
    periods: [
      { id: 'quarters', label: 'Quarters (4)', count: 4 },
    ],
    defaultPeriodType: 'quarters',
    periodLabel: (n) => `Q${n}`,
    positions: ['QB','RB','WR','TE','OL','DE','DT','LB','CB','S','K','P','LS'],
    ageGroups: ['6U','8U','10U','12U','14U','Freshman','JV','Varsity'],
    statCategories: [
      // Offense
      { id:'pass_comp',   label:'Completion', color:'green', group:'passing' },
      { id:'pass_inc',    label:'Incomplete',  color:'red',   group:'passing' },
      { id:'pass_td',     label:'Pass TD',    color:'green', group:'passing' },
      { id:'pass_int',    label:'INT',        color:'red',   group:'passing' },
      { id:'rush_gain',   label:'Rush+',      color:'green', group:'rushing' },
      { id:'rush_loss',   label:'Rush−',      color:'red',   group:'rushing' },
      { id:'rush_td',     label:'Rush TD',    color:'green', group:'rushing' },
      { id:'reception',   label:'Reception',  color:'blue',  group:'receiving' },
      { id:'rec_td',      label:'Rec TD',     color:'green', group:'receiving' },
      // Defense
      { id:'tackle',      label:'Tackle',     color:'blue',  group:'defense' },
      { id:'sack',        label:'Sack',       color:'purple',group:'defense' },
      { id:'def_int',     label:'INT (Def)',  color:'green', group:'defense' },
      { id:'fumble_rec',  label:'Fumble Rec', color:'green', group:'defense' },
      { id:'penalty',     label:'Penalty',    color:'amber', group:'special' },
    ],
    boxScoreStats: ['pass_yards','pass_td','pass_int','rush_yards','rush_td','rec_yards','rec_td','tackles','sacks'],
    statLabels: { pass_yards:'PASS YDS',pass_td:'PASS TD',pass_int:'INT',
                  rush_yards:'RUSH YDS',rush_td:'RUSH TD',
                  rec_yards:'REC YDS',rec_td:'REC TD',
                  tackles:'TCKL',sacks:'SACKS' },
    fieldType: 'football_field',
    hasOpponentShots: false,
    scoringUnit: 'points',
  },

  baseball: {
    label: 'Baseball',
    icon: '⚾',
    teamSize: { min: 9, max: 25 },
    periods: [
      { id: 'innings_9', label: '9 Innings',  count: 9 },
      { id: 'innings_7', label: '7 Innings',  count: 7 },
    ],
    defaultPeriodType: 'innings_9',
    periodLabel: (n) => `Inn ${n}`,
    positions: ['P','C','1B','2B','SS','3B','LF','CF','RF','DH'],
    ageGroups: ['6U','8U','10U','12U','14U','16U','18U','JV','Varsity'],
    statCategories: [
      // Batting
      { id:'hit_single',  label:'Single',     color:'green', group:'batting' },
      { id:'hit_double',  label:'Double',     color:'green', group:'batting' },
      { id:'hit_triple',  label:'Triple',     color:'green', group:'batting' },
      { id:'home_run',    label:'Home Run',   color:'green', group:'batting' },
      { id:'rbi',         label:'RBI',        color:'blue',  group:'batting' },
      { id:'strikeout_b', label:'Strikeout',  color:'red',   group:'batting' },
      { id:'walk',        label:'Walk (BB)',  color:'blue',  group:'batting' },
      { id:'hit_by_pitch',label:'HBP',        color:'amber', group:'batting' },
      { id:'stolen_base', label:'Stolen Base',color:'blue',  group:'batting' },
      // Pitching
      { id:'strikeout_p', label:'K (Pitch)',  color:'green', group:'pitching' },
      { id:'walk_p',      label:'BB (Pitch)', color:'red',   group:'pitching' },
      { id:'earned_run',  label:'Earned Run', color:'red',   group:'pitching' },
      // Fielding
      { id:'error',       label:'Error',      color:'red',   group:'fielding' },
      { id:'putout',      label:'Putout',     color:'blue',  group:'fielding' },
    ],
    boxScoreStats: ['ab','hits','runs','rbi','hr','bb','so','avg','era'],
    statLabels: { ab:'AB',hits:'H',runs:'R',rbi:'RBI',hr:'HR',bb:'BB',so:'K',avg:'AVG',era:'ERA' },
    fieldType: 'baseball_diamond',
    hasOpponentShots: false,
    scoringUnit: 'runs',
  },

  softball: {
    label: 'Softball',
    icon: '🥎',
    teamSize: { min: 9, max: 20 },
    periods: [
      { id: 'innings_7', label: '7 Innings', count: 7 },
    ],
    defaultPeriodType: 'innings_7',
    periodLabel: (n) => `Inn ${n}`,
    positions: ['P','C','1B','2B','SS','3B','LF','CF','RF','DP','FLEX'],
    ageGroups: ['8U','10U','12U','14U','16U','18U','JV','Varsity'],
    statCategories: [
      { id:'hit_single',  label:'Single',     color:'green', group:'batting' },
      { id:'hit_double',  label:'Double',     color:'green', group:'batting' },
      { id:'hit_triple',  label:'Triple',     color:'green', group:'batting' },
      { id:'home_run',    label:'Home Run',   color:'green', group:'batting' },
      { id:'rbi',         label:'RBI',        color:'blue',  group:'batting' },
      { id:'strikeout_b', label:'Strikeout',  color:'red',   group:'batting' },
      { id:'walk',        label:'Walk',       color:'blue',  group:'batting' },
      { id:'stolen_base', label:'Stolen Base',color:'blue',  group:'batting' },
      { id:'strikeout_p', label:'K (Pitch)',  color:'green', group:'pitching' },
      { id:'walk_p',      label:'BB (Pitch)', color:'red',   group:'pitching' },
      { id:'earned_run',  label:'Earned Run', color:'red',   group:'pitching' },
      { id:'error',       label:'Error',      color:'red',   group:'fielding' },
    ],
    boxScoreStats: ['ab','hits','runs','rbi','hr','bb','so','avg','era'],
    statLabels: { ab:'AB',hits:'H',runs:'R',rbi:'RBI',hr:'HR',bb:'BB',so:'K',avg:'AVG',era:'ERA' },
    fieldType: 'baseball_diamond',
    hasOpponentShots: false,
    scoringUnit: 'runs',
  },

  soccer: {
    label: 'Soccer',
    icon: '⚽',
    teamSize: { min: 11, max: 25 },
    periods: [
      { id: 'halves',  label: 'Halves (2)',   count: 2 },
      { id: 'periods', label: 'Periods (2)',  count: 2 },
    ],
    defaultPeriodType: 'halves',
    periodLabel: (n) => `H${n}`,
    positions: ['GK','RB','CB','LB','CDM','CM','CAM','RM','LM','RW','LW','ST','CF'],
    ageGroups: ['U6','U8','U10','U12','U14','U16','U18','JV','Varsity'],
    statCategories: [
      { id:'goal',        label:'Goal',       color:'green', group:'attacking' },
      { id:'assist',      label:'Assist',     color:'green', group:'attacking' },
      { id:'shot_on',     label:'Shot On',    color:'blue',  group:'attacking' },
      { id:'shot_off',    label:'Shot Off',   color:'red',   group:'attacking' },
      { id:'save',        label:'Save (GK)',  color:'green', group:'goalkeeping' },
      { id:'goal_allow',  label:'Goal Allow', color:'red',   group:'goalkeeping' },
      { id:'tackle_w',    label:'Tackle Win', color:'blue',  group:'defending' },
      { id:'interception',label:'Interception',color:'blue', group:'defending' },
      { id:'clearance',   label:'Clearance',  color:'blue',  group:'defending' },
      { id:'foul',        label:'Foul',       color:'amber', group:'discipline' },
      { id:'yellow_card', label:'Yellow Card',color:'amber', group:'discipline' },
      { id:'red_card',    label:'Red Card',   color:'red',   group:'discipline' },
      { id:'offside',     label:'Offside',    color:'amber', group:'discipline' },
    ],
    boxScoreStats: ['goals','assists','shots','shots_on','saves','fouls','yellow','red'],
    statLabels: { goals:'G',assists:'A',shots:'SH',shots_on:'SOG',saves:'SV',fouls:'F',yellow:'YC',red:'RC' },
    fieldType: 'soccer_pitch',
    hasOpponentShots: true,
    scoringUnit: 'goals',
  },

  volleyball: {
    label: 'Volleyball',
    icon: '🏐',
    teamSize: { min: 6, max: 15 },
    periods: [
      { id: 'sets_5',  label: 'Best of 5 Sets', count: 5 },
      { id: 'sets_3',  label: 'Best of 3 Sets', count: 3 },
    ],
    defaultPeriodType: 'sets_5',
    periodLabel: (n) => `Set ${n}`,
    positions: ['S','OH','MB','OPP','L','DS'],
    ageGroups: ['10U','12U','14U','16U','18U','JV','Varsity'],
    statCategories: [
      { id:'kill',        label:'Kill',       color:'green', group:'attacking' },
      { id:'attack_err',  label:'Attack Err', color:'red',   group:'attacking' },
      { id:'attack_zero', label:'Attack 0',   color:'amber', group:'attacking' },
      { id:'ace',         label:'Ace',        color:'green', group:'serving' },
      { id:'serve_err',   label:'Serve Err',  color:'red',   group:'serving' },
      { id:'block',       label:'Block',      color:'blue',  group:'blocking' },
      { id:'block_err',   label:'Block Err',  color:'red',   group:'blocking' },
      { id:'dig',         label:'Dig',        color:'blue',  group:'defense' },
      { id:'rec_perfect', label:'Perfect Rec',color:'green', group:'defense' },
      { id:'rec_err',     label:'Rec Error',  color:'red',   group:'defense' },
      { id:'assist_v',    label:'Set Assist', color:'blue',  group:'setting' },
    ],
    boxScoreStats: ['kills','aces','blocks','digs','assists','attack_err','serve_err'],
    statLabels: { kills:'K',aces:'ACE',blocks:'BLK',digs:'DIG',assists:'AST',attack_err:'AE',serve_err:'SE' },
    fieldType: 'volleyball_court',
    hasOpponentShots: false,
    scoringUnit: 'points',
  },
}

export function getSportConfig(sport) {
  return SPORT_CONFIG[sport] || SPORT_CONFIG.basketball
}

export function useSport(sport) {
  return getSportConfig(sport)
}

export default useSport
