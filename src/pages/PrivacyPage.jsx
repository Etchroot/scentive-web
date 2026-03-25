import styles from './PrivacyPage.module.css';
import Navbar from '../components/common/Navbar';

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className={styles.container}>

        <header className={styles.header}>
          <div className={styles.appName}>잔향 (Janhyang)</div>
          <h1 className={styles.title}>개인정보처리방침</h1>
          <div className={styles.effectiveDate}>시행일자: 2026년 3월 22일</div>
        </header>

        <div className={styles.intro}>
          (주)뉴노즈(이하 "회사")는 「잔향(Janhyang)」 서비스(이하 "서비스") 이용자의 개인정보를 소중히 여기며,
          「개인정보 보호법」을 준수합니다.
          본 방침은 서비스가 수집하는 개인정보의 항목, 수집 목적, 보유 기간, 그리고 이용자의 권리에 대해 안내합니다.
        </div>

        {/* 1. 수집하는 개인정보 항목 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>1</span>수집하는 개인정보 항목</h2>
          <p>서비스는 다음과 같은 개인정보를 수집합니다.</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>수집 시점</th>
                <th>수집 항목</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google 소셜 로그인 시</td>
                <td>이메일 주소, 이름(닉네임), 프로필 사진 URL, Google 계정 고유 식별자(UID)</td>
              </tr>
              <tr>
                <td>온보딩(초기 설정) 시</td>
                <td>향 취향(선호/비선호 향 계열), 나이, 성별 <em>(선택 사항)</em></td>
              </tr>
              <tr>
                <td>서비스 이용 중</td>
                <td>일기 내용(AES-256 암호화 저장), AI 분석 결과(감정·향 매칭 데이터), 미래게시 조향 기록, 앱 이용 기록(접속 일시, 기능 사용 내역)</td>
              </tr>
              <tr>
                <td>서비스 오류 발생 시</td>
                <td>기기 정보(OS 버전, 앱 버전), 오류 로그 (Firebase Crashlytics)</td>
              </tr>
            </tbody>
          </table>
          <div className={styles.highlight}>
            서비스는 민감정보(건강, 정치적 견해 등)를 수집하지 않습니다.
            일기 내용은 AI 분석 목적으로만 처리되며, 제3자에게 제공되지 않습니다.
          </div>
        </section>

        {/* 2. 수집 및 이용 목적 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>2</span>개인정보 수집 및 이용 목적</h2>
          <p>수집한 개인정보는 다음 목적으로만 이용됩니다.</p>
          <ul>
            <li><strong>서비스 제공:</strong> 회원 식별, 로그인 유지, 일기 데이터 저장 및 동기화</li>
            <li><strong>AI 기능 제공:</strong> 일기 내용을 분석하여 향 추천 및 감정 리포트 생성</li>
            <li><strong>서비스 개선:</strong> 앱 이용 통계 분석(Firebase Analytics), 오류 개선(Firebase Crashlytics)</li>
            <li><strong>공지 및 알림:</strong> 월간 리포트 생성 알림, 서비스 변경 사항 안내(Firebase Cloud Messaging)</li>
          </ul>
        </section>

        {/* 3. 보유 기간 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>3</span>개인정보 보유 및 이용 기간</h2>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>항목</th>
                <th>보유 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>계정 정보 (이메일, 이름, UID)</td>
                <td>회원 탈퇴 시 즉시 삭제</td>
              </tr>
              <tr>
                <td>일기 및 향 데이터</td>
                <td>회원 탈퇴 시 즉시 삭제</td>
              </tr>
              <tr>
                <td>앱 이용 로그 (분석 목적)</td>
                <td>수집일로부터 최대 26개월 (Firebase Analytics 기본 정책)</td>
              </tr>
              <tr>
                <td>오류 로그 (Crashlytics)</td>
                <td>수집일로부터 최대 90일</td>
              </tr>
            </tbody>
          </table>
          <p>단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관 후 삭제합니다.</p>
        </section>

        {/* 4. 제3자 제공 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>4</span>개인정보 제3자 제공</h2>
          <div className={styles.highlight}>
            서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다.
            다만, 이용자의 사전 동의가 있거나 법령에 의한 경우는 예외입니다.
          </div>
        </section>

        {/* 5. 처리 위탁 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>5</span>개인정보 처리 위탁</h2>
          <p>서비스는 원활한 이용을 위해 다음과 같이 개인정보 처리 업무를 위탁합니다.</p>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>위탁 업체</th>
                <th>위탁 업무</th>
                <th>보유 및 이용 기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Google LLC (Firebase)</td>
                <td>인증(Firebase Auth), 데이터 저장, 앱 분석, 푸시 알림, 오류 수집</td>
                <td>서비스 종료 또는 위탁 계약 종료 시까지</td>
              </tr>
              <tr>
                <td>Microsoft Azure</td>
                <td>AI 분석 API 서버 호스팅, 백엔드 서비스 이용, Azure OpenAI를 통한 감정-향 분석</td>
                <td>서비스 종료 또는 위탁 계약 종료 시까지</td>
              </tr>
            </tbody>
          </table>
          <p>각 위탁 업체의 개인정보 처리방침은 해당 업체의 공식 사이트에서 확인하실 수 있습니다.</p>
        </section>

        {/* 6. AI 기반 자동화된 처리 및 윤리 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>6</span>AI 기반 자동화 처리 및 AI 윤리</h2>
          <p>서비스는 일기 텍스트를 AI 모델로 분석하여 향 레시피를 생성하는 자동화된 결정을 사용합니다.</p>
          <ul>
            <li><strong>자동화 처리 내용:</strong> 일기에서 감정·감각·형용사 키워드를 추출하고, 향 분자 DB와 매칭해 레시피를 생성합니다.</li>
            <li><strong>인간 검토 거부권:</strong> 자동 생성된 향 레시피에 동의하지 않을 경우, 앱 내 피드백 기능으로 재분석을 요청할 수 있습니다.</li>
            <li><strong>차별 금지:</strong> AI 모델은 성별·나이·지역 등 보호 속성에 의한 차별적 출력이 발생하지 않도록 설계됩니다.</li>
            <li><strong>투명성:</strong> 서비스는 AI 추천 근거(키워드, 매칭 향 계열)를 이용자에게 앱 내에서 공개합니다.</li>
            <li><strong>데이터 최소화:</strong> AI 분석에 필요한 최소한의 텍스트 데이터만 처리하며, 분석 완료 후 원문 일기는 이용자 계정에만 암호화 저장됩니다.</li>
            <li><strong>모델 개선 불사용:</strong> 이용자의 일기 내용은 AI 모델 학습·개선 목적으로 사용되지 않습니다.</li>
          </ul>
        </section>

        {/* 7. 이용자의 권리 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>7</span>이용자의 권리 및 행사 방법</h2>
          <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ul>
            <li><strong>열람:</strong> 본인의 개인정보 처리 현황 조회</li>
            <li><strong>수정:</strong> 잘못된 개인정보의 정정 신청</li>
            <li><strong>삭제(탈퇴):</strong> 앱 내 [설정 → 회원 탈퇴]에서 즉시 처리</li>
            <li><strong>처리 정지:</strong> 개인정보 처리의 일시적 정지 신청</li>
          </ul>
          <p>권리 행사는 앱 내 설정 화면 또는 아래 개인정보 보호책임자에게 이메일로 요청하실 수 있습니다. 요청은 접수 후 10일 이내에 처리됩니다.</p>
        </section>

        {/* 8. 보호책임자 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>8</span>개인정보 보호책임자</h2>
          <p>개인정보 관련 문의, 불만 처리, 피해 구제 등에 관한 사항은 아래 담당자에게 연락해주세요.</p>
          <div className={styles.contactCard}>
            <p><strong>개인정보 보호책임자</strong></p>
            <p>성명: 배성우</p>
            <p>소속: (주)뉴노즈</p>
            <p>이메일: <a href="mailto:newnose@gmail.com">newnose@gmail.com</a></p>
            <p>처리 기간: 접수 후 10일 이내</p>
          </div>
          <p style={{ marginTop: '16px' }}>또한, 개인정보 침해 신고·상담은 아래 기관에 문의하실 수 있습니다.</p>
          <ul>
            <li>개인정보 침해신고센터: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer">privacy.kisa.or.kr</a> (국번없이 118)</li>
            <li>개인정보 분쟁조정위원회: <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer">www.kopico.go.kr</a> (1833-6972)</li>
          </ul>
        </section>

        {/* 9. 변경 안내 */}
        <section className={styles.section}>
          <h2><span className={styles.num}>9</span>개인정보처리방침 변경 안내</h2>
          <p>본 방침은 법령 또는 서비스 정책 변경에 따라 수정될 수 있습니다. 변경 시 앱 내 공지 또는 이 페이지를 통해 사전 안내합니다.</p>
        </section>

        <footer className={styles.footer}>
          <p>(주)뉴노즈 (NewNose) &nbsp;|&nbsp; 개인정보처리방침 시행일자: 2026년 3월 22일</p>
        </footer>

      </div>
    </>
  );
}
