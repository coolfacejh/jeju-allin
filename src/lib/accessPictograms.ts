import { PICTOGRAM_IMAGES } from '../data/accessPictogramImages';
import { accessRows } from './access';
import type { Content } from '../types';
export const PICTOGRAM_SOURCE = 'https://easyjeju.net/bbs/board.php?bo_table=11_1_1_1&wr_id=89';
export const PICTOGRAM_GROUPS = ['이동·도움 정도','주차·출입·시설','숙박·대여','영유아·돌봄','시각·청각 지원'];
const descriptions: Record<number,string> = {
  1:'이지제주 기준: 모든 입구·보행로의 단차 2cm 이하, 경사 1/12(약 4.8°) 이하. 개인별 이용 가능을 보장하는 표시는 아닙니다.',
  2:'동행자의 도움 난도가 낮은 단계입니다. 어떤 도움이 필요한지 상세 안내를 확인하세요.',
  3:'동행자의 도움이 다소 어려운 단계입니다. 보조 방법과 이동 조건을 확인하세요.',
  4:'동행자의 도움이 매우 어려운 단계입니다. 방문 전 구체적인 지원 가능 여부를 문의하세요.',
  5:'이지제주 분류: 경사 1/12 초과~1/8 이하(약 4.8° 초과~7.1° 이하).',
  6:'이지제주 분류: 경사 1/8 초과~1/7 이하(약 7.1° 초과~8.1° 이하).',
  7:'이지제주 분류: 경사 1/7 초과(약 8.1° 초과).',
  8:'이지제주 분류: 단차 높이 2cm 초과~5cm 이하.',
  9:'이지제주 분류: 단차 높이 5cm 초과~10cm 이하.',
  10:'이지제주 분류: 단차 높이 10cm 초과.',
  11:'일반 주차 시설 표시입니다. 장애인 전용 구역은 별도 항목입니다.',
  12:'장애인 전용 주차 구역 표시입니다. 주차 후 입구까지의 길도 확인하세요.',
  13:'매표소까지 계단·턱 없이 접근하는 경로를 뜻합니다.',
  14:'장애인용으로 지정된 화장실 표시입니다. 내부 공간과 운영 상태는 추가 확인하세요.',
  15:'가족화장실 표시입니다. 장애인 화장실과 같은 의미는 아닙니다.',
  16:'승강기 설치 표시입니다. 출입문 폭과 내부 크기는 별도 확인하세요.',
  17:'장애인 리프트 표시입니다. 이용 방법과 직원 지원을 확인하세요.',
  18:'계단·턱 없이 안내데스크에 접근하는 경로를 뜻합니다.',
  19:'키오스크까지의 접근 경로 안내입니다. 화면 조작 편의까지 보장하지 않습니다.',
  20:'입식 테이블 표시입니다. 휠체어 무릎 공간은 별도로 확인하세요.',
  21:'장애인용으로 지정된 객실 표시입니다. 예약과 객실별 시설을 확인하세요.',
  22:'초인등 설치 표시입니다. 작동 여부와 알림 방식을 확인하세요.',
  23:'차인벨 설치 표시입니다. 위치와 사용 방법을 확인하세요.',
  24:'장애인 관람석 표시입니다. 예약·동반자 좌석·진입 경로를 확인하세요.',
  25:'휠체어 대여 안내입니다. 재고·예약·요금을 확인하세요.',
  26:'유아차 대여 안내입니다. 재고·대여 조건을 확인하세요.',
  27:'점자책 대여 안내입니다. 제공 자료를 확인하세요.',
  28:'진동알람시계 대여 안내입니다. 대여 가능 여부를 확인하세요.',
  29:'아기의자 대여 안내입니다. 이용 가능 수량을 확인하세요.',
  30:'수유실 표시입니다. 위치와 운영 시간을 확인하세요.',
  31:'기저귀 교환대 표시입니다. 설치 장소를 확인하세요.',
  32:'전동휠체어 급속충전 시설 표시입니다. 기기 호환과 운영 상태를 확인하세요.',
  33:'수어 해설 지원 안내입니다. 예약과 제공 시간을 확인하세요.',
  34:'음성 해설 지원 안내입니다. 제공 방식과 언어를 확인하세요.',
  35:'안내견 동반 출입 안내입니다. 일반 반려견 동반과 구분합니다.',
  36:'점자블록 설치 안내입니다. 경로의 연결 상태도 확인하세요.',
  37:'점자 안내판 또는 촉지도로 공간 정보를 제공합니다.',
};
function group(id:number):string {
 if(id<=10) return PICTOGRAM_GROUPS[0];
 if([26,29,30,31].includes(id)) return PICTOGRAM_GROUPS[3];
 if([22,23,27,28,33,34,35,36,37].includes(id)) return PICTOGRAM_GROUPS[4];
 if([21,25].includes(id)) return PICTOGRAM_GROUPS[2];
 return PICTOGRAM_GROUPS[1];
}
export const ACCESS_PICTOGRAMS = PICTOGRAM_IMAGES.map(p=>({...p, group:group(p.id),description:descriptions[p.id]}));
// Only map equivalent, evidenced facility presence. Never infer EasyJeju grades,
// independent access, or broad wheelchair suitability from a generic facility tag.
export function confirmedPictograms(place:Content) {
 const mapping: Record<string,number> = {parking:12,restroom:14,elevator:16};
 return accessRows(place).flatMap(row=>row.state==='available' && mapping[row.key]
   ? [{pictogram:ACCESS_PICTOGRAMS.find(p=>p.id===mapping[row.key])!,evidence:row.evidence}] : []);
}
