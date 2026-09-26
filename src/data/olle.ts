// Factual catalogue checked against the official Korean course detail pages on 2026-09-21.
// 27 courses; 3 and 15 each have A/B alternatives. No copied photos or descriptive prose.
export interface OlleCourse {
  slug: string; code: string; name: string; region: string; island: string;
  distanceKm: number; hours: number[]; difficulty: string;
  start: { name: string; lat: number; lng: number };
  end: { name: string; lat: number; lng: number };
  accessSegment: { segment: string; startAddress: string } | null;
}
export const OLLE_CHECKED_AT = '2026-09-21';
export const OLLE_COURSES: OlleCourse[] = [
  {
    "slug": "01",
    "code": "1",
    "name": "시흥 - 광치기 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 15.1,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "시흥",
      "lat": 33.47721951082349,
      "lng": 126.89584652893245
    },
    "end": {
      "name": "광치기",
      "lat": 33.45201571471989,
      "lng": 126.92432245239615
    },
    "accessSegment": {
      "segment": "4.6km / 종달리 옛 소금밭 ~ 성산갑문 입구",
      "startAddress": "제주시 구좌읍 종달리 814-5"
    }
  },
  {
    "slug": "01_1",
    "code": "1-1",
    "name": "우도 올레",
    "region": "우도",
    "island": "우도",
    "distanceKm": 13.2,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "우도 공식 시작점",
      "lat": 33.509505009278655,
      "lng": 126.94261503405869
    },
    "end": {
      "name": "우도 공식 종점",
      "lat": 33.509505009278655,
      "lng": 126.94261503405869
    },
    "accessSegment": null
  },
  {
    "slug": "02",
    "code": "2",
    "name": "광치기 - 온평 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 14.8,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "광치기",
      "lat": 33.45201797783375,
      "lng": 126.92433603107929
    },
    "end": {
      "name": "온평",
      "lat": 33.40511603280902,
      "lng": 126.90403900109231
    },
    "accessSegment": null
  },
  {
    "slug": "03_A",
    "code": "3-A",
    "name": "온평 - 표선 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 20.9,
    "hours": [
      6,
      7
    ],
    "difficulty": "어려움",
    "start": {
      "name": "온평",
      "lat": 33.40515802614391,
      "lng": 126.90413799136877
    },
    "end": {
      "name": "표선",
      "lat": 33.32521797157824,
      "lng": 126.84276603162289
    },
    "accessSegment": null
  },
  {
    "slug": "03_B",
    "code": "3-B",
    "name": "온평 - 표선 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 14.6,
    "hours": [
      4,
      5
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "온평",
      "lat": 33.40515802614391,
      "lng": 126.90413799136877
    },
    "end": {
      "name": "표선",
      "lat": 33.32521797157824,
      "lng": 126.84276603162289
    },
    "accessSegment": null
  },
  {
    "slug": "04",
    "code": "4",
    "name": "표선 - 남원 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 19.0,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "표선",
      "lat": 33.3252787,
      "lng": 126.842741
    },
    "end": {
      "name": "남원",
      "lat": 33.278049,
      "lng": 126.719756
    },
    "accessSegment": {
      "segment": "5.5km / 당케포구 ~ 세화2리 해녀의집",
      "startAddress": "서귀포시 표선면 민속해안로 566-1"
    }
  },
  {
    "slug": "05",
    "code": "5",
    "name": "남원 - 쇠소깍 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 13.4,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "남원",
      "lat": 33.27803598716855,
      "lng": 126.71971298754215
    },
    "end": {
      "name": "쇠소깍",
      "lat": 33.25837397016585,
      "lng": 126.62355596199632
    },
    "accessSegment": {
      "segment": "2.4km / 국립수산과학원 ~ 위미항",
      "startAddress": "서귀포시 남원읍 위미리 785-1"
    }
  },
  {
    "slug": "06",
    "code": "6",
    "name": "쇠소깍 - 제주올레 여행자센터 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 10.1,
    "hours": [
      3,
      4
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "쇠소깍",
      "lat": 33.2583897,
      "lng": 126.6235447
    },
    "end": {
      "name": "제주올레 여행자센터",
      "lat": 33.2474985,
      "lng": 126.5586401
    },
    "accessSegment": {
      "segment": "2.3km / 쇠소깍 ~ 보목포구",
      "startAddress": "서귀포시 하효동 999"
    }
  },
  {
    "slug": "07",
    "code": "7",
    "name": "제주올레 여행자센터 - 서귀포 버스터미널 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 12.9,
    "hours": [
      3,
      4
    ],
    "difficulty": "보통",
    "start": {
      "name": "제주올레 여행자센터",
      "lat": 33.2475429,
      "lng": 126.5587111
    },
    "end": {
      "name": "서귀포 버스터미널",
      "lat": 33.2491179,
      "lng": 126.5082535
    },
    "accessSegment": null
  },
  {
    "slug": "07_1",
    "code": "7-1",
    "name": "서귀포 버스터미널 - 제주올레 여행자센터 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 15.7,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "서귀포 버스터미널",
      "lat": 33.2491179,
      "lng": 126.5082535
    },
    "end": {
      "name": "제주올레 여행자센터",
      "lat": 33.2475266,
      "lng": 126.5587068
    },
    "accessSegment": null
  },
  {
    "slug": "08",
    "code": "8",
    "name": "월평 - 대평 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 19.3,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "월평",
      "lat": 33.243570355698466,
      "lng": 126.45860538817942
    },
    "end": {
      "name": "대평",
      "lat": 33.235901,
      "lng": 126.363039
    },
    "accessSegment": {
      "segment": "3.4km / 논짓물 ~ 대평포구",
      "startAddress": "서귀포시 하예동 532-3"
    }
  },
  {
    "slug": "09",
    "code": "9",
    "name": "대평 - 화순 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 12.3,
    "hours": [
      3,
      4
    ],
    "difficulty": "어려움",
    "start": {
      "name": "대평",
      "lat": 33.235901,
      "lng": 126.363039
    },
    "end": {
      "name": "화순",
      "lat": 33.240065,
      "lng": 126.3353466
    },
    "accessSegment": null
  },
  {
    "slug": "10",
    "code": "10",
    "name": "화순 - 모슬포 올레",
    "region": "남부",
    "island": "",
    "distanceKm": 15.6,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "화순",
      "lat": 33.239970495924354,
      "lng": 126.33518077433109
    },
    "end": {
      "name": "모슬포",
      "lat": 33.21914699859917,
      "lng": 126.25285900197923
    },
    "accessSegment": {
      "segment": "2.7km / 사계어촌체험마을 ~ 송악산 주차장",
      "startAddress": "서귀포시 안덕면 형제해안로 13-1"
    }
  },
  {
    "slug": "10_1",
    "code": "10-1",
    "name": "가파도 올레",
    "region": "가파도",
    "island": "가파도",
    "distanceKm": 4.2,
    "hours": [
      1,
      2
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "가파도 공식 시작점",
      "lat": 33.17451554350555,
      "lng": 126.27093650400639
    },
    "end": {
      "name": "가파도 공식 종점",
      "lat": 33.16720166243613,
      "lng": 126.27430971711874
    },
    "accessSegment": {
      "segment": "4.2km / 상동포구 ~ 가파치안센터",
      "startAddress": "가파도 상동포구"
    }
  },
  {
    "slug": "11",
    "code": "11",
    "name": "모슬포 - 무릉 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 17.3,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "모슬포",
      "lat": 33.219141,
      "lng": 126.2528266
    },
    "end": {
      "name": "무릉",
      "lat": 33.273203,
      "lng": 126.2364855
    },
    "accessSegment": null
  },
  {
    "slug": "12",
    "code": "12",
    "name": "무릉 - 용수 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 17.5,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "무릉",
      "lat": 33.2731928,
      "lng": 126.2365034
    },
    "end": {
      "name": "용수",
      "lat": 33.323542,
      "lng": 126.166816
    },
    "accessSegment": {
      "segment": "1.1km / 엉알길 입구 ~ 자구내포구 입구",
      "startAddress": "제주시 한경면 고산리 3674-2"
    }
  },
  {
    "slug": "13",
    "code": "13",
    "name": "용수 - 저지 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 16.2,
    "hours": [
      4,
      5
    ],
    "difficulty": "보통",
    "start": {
      "name": "용수",
      "lat": 33.3235731,
      "lng": 126.166664
    },
    "end": {
      "name": "저지",
      "lat": 33.3337211,
      "lng": 126.2563357
    },
    "accessSegment": null
  },
  {
    "slug": "14",
    "code": "14",
    "name": "저지 - 한림 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 19.9,
    "hours": [
      6,
      7
    ],
    "difficulty": "보통",
    "start": {
      "name": "저지",
      "lat": 33.33366642706096,
      "lng": 126.25630765222013
    },
    "end": {
      "name": "한림",
      "lat": 33.419231325387955,
      "lng": 126.26231051981449
    },
    "accessSegment": {
      "segment": "2.1km / 일성콘도 ~ 금능해수욕장",
      "startAddress": "제주시 한림읍 금능리 1625"
    }
  },
  {
    "slug": "14_1",
    "code": "14-1",
    "name": "저지 - 서광 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 9.3,
    "hours": [
      3,
      4
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "저지",
      "lat": 33.33366642706096,
      "lng": 126.25630765222013
    },
    "end": {
      "name": "서광",
      "lat": 33.306983979418874,
      "lng": 126.2879329919815
    },
    "accessSegment": null
  },
  {
    "slug": "15_A",
    "code": "15-A",
    "name": "한림 - 고내 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 15.5,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "한림",
      "lat": 33.41915303841233,
      "lng": 126.26240096054971
    },
    "end": {
      "name": "고내",
      "lat": 33.467186372727156,
      "lng": 126.33876127190888
    },
    "accessSegment": null
  },
  {
    "slug": "15_B",
    "code": "15-B",
    "name": "한림 - 고내 올레",
    "region": "서부",
    "island": "",
    "distanceKm": 13.0,
    "hours": [
      4,
      5
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "한림",
      "lat": 33.41915303841233,
      "lng": 126.26240096054971
    },
    "end": {
      "name": "고내",
      "lat": 33.46695997752249,
      "lng": 126.3382369838655
    },
    "accessSegment": null
  },
  {
    "slug": "16",
    "code": "16",
    "name": "고내 - 광령 올레",
    "region": "북부",
    "island": "",
    "distanceKm": 14.8,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "고내",
      "lat": 33.467342,
      "lng": 126.339122
    },
    "end": {
      "name": "광령",
      "lat": 33.4595542790375,
      "lng": 126.433414139263
    },
    "accessSegment": null
  },
  {
    "slug": "17",
    "code": "17",
    "name": "광령 - 김만덕기념관 올레",
    "region": "북부",
    "island": "",
    "distanceKm": 19.5,
    "hours": [
      6,
      7
    ],
    "difficulty": "보통",
    "start": {
      "name": "광령",
      "lat": 33.4595542790375,
      "lng": 126.433414139263
    },
    "end": {
      "name": "김만덕기념관",
      "lat": 33.5159804,
      "lng": 126.5304208
    },
    "accessSegment": {
      "segment": "5.0km / 도두봉 내려오는길 ~ 용연다리",
      "startAddress": "제주시 도두2동 1611"
    }
  },
  {
    "slug": "18",
    "code": "18",
    "name": "김만덕기념관 - 조천 올레",
    "region": "북부",
    "island": "",
    "distanceKm": 17.1,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "김만덕기념관",
      "lat": 33.5159804,
      "lng": 126.5304208
    },
    "end": {
      "name": "조천",
      "lat": 33.5405258,
      "lng": 126.6397746
    },
    "accessSegment": null
  },
  {
    "slug": "18_1",
    "code": "18-1",
    "name": "상추자 올레",
    "region": "추자도",
    "island": "추자도",
    "distanceKm": 11.4,
    "hours": [
      4,
      5
    ],
    "difficulty": "어려움",
    "start": {
      "name": "추자도 공식 시작점",
      "lat": 33.96355563774705,
      "lng": 126.29615312442183
    },
    "end": {
      "name": "추자도 공식 종점",
      "lat": 33.94480247050524,
      "lng": 126.32928092032671
    },
    "accessSegment": null
  },
  {
    "slug": "18_2",
    "code": "18-2",
    "name": "하추자 올레",
    "region": "추자도",
    "island": "추자도",
    "distanceKm": 9.7,
    "hours": [
      3,
      4
    ],
    "difficulty": "어려움",
    "start": {
      "name": "추자도 공식 시작점",
      "lat": 33.9448025,
      "lng": 126.3292809
    },
    "end": {
      "name": "추자도 공식 종점",
      "lat": 33.9634785,
      "lng": 126.2960908
    },
    "accessSegment": null
  },
  {
    "slug": "19",
    "code": "19",
    "name": "조천 - 김녕 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 19.4,
    "hours": [
      6,
      7
    ],
    "difficulty": "보통",
    "start": {
      "name": "조천",
      "lat": 33.54038997553289,
      "lng": 126.64002598263323
    },
    "end": {
      "name": "김녕",
      "lat": 33.55775501579046,
      "lng": 126.74487504176795
    },
    "accessSegment": null
  },
  {
    "slug": "20",
    "code": "20",
    "name": "김녕 - 하도 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 17.4,
    "hours": [
      5,
      6
    ],
    "difficulty": "보통",
    "start": {
      "name": "김녕",
      "lat": 33.557684,
      "lng": 126.744868
    },
    "end": {
      "name": "하도",
      "lat": 33.522355,
      "lng": 126.862741
    },
    "accessSegment": null
  },
  {
    "slug": "21",
    "code": "21",
    "name": "하도 - 종달 올레",
    "region": "동부",
    "island": "",
    "distanceKm": 11.3,
    "hours": [
      3,
      4
    ],
    "difficulty": "쉬움",
    "start": {
      "name": "하도",
      "lat": 33.5219938,
      "lng": 126.8628017
    },
    "end": {
      "name": "종달",
      "lat": 33.488836,
      "lng": 126.905312
    },
    "accessSegment": null
  }
];
