import { useEffect, useMemo, useState } from "react";
import {
  getCurrentSession,
  signInWithEmail,
  signInWithGoogle,
  signInWithKakao,
  signOut,
  signUpWithEmail,
  subscribeAuthState,
} from "./services/userAuth";

const initialAuthForm = { email: "", password: "" };

function App() {
  const [mode, setMode] = useState("signin");
  const [signInForm, setSignInForm] = useState(initialAuthForm);
  const [signUpForm, setSignUpForm] = useState(initialAuthForm);
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const redirectTo = useMemo(() => window.location.origin, []);
  const user = session?.user;

  useEffect(() => {
    getCurrentSession().then(({ data }) => {
      setSession(data.session);
    });

    const {
      data: { subscription },
    } = subscribeAuthState((_event, authSession) => {
      setSession(authSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const updateSignInForm = (event) => {
    const { name, value } = event.target;
    setSignInForm((current) => ({ ...current, [name]: value }));
  };

  const updateSignUpForm = (event) => {
    const { name, value } = event.target;
    setSignUpForm((current) => ({ ...current, [name]: value }));
  };

  const runAuthAction = async (action, successMessage) => {
    setIsLoading(true);
    setErrorMessage("");
    setStatus("");

    try {
      const { error } = await action();
      if (error) {
        setErrorMessage(error.message);
        return false;
      }
      if (successMessage) {
        setStatus(successMessage);
      }
      return true;
    } catch (error) {
      setErrorMessage(error.message ?? "알 수 없는 오류가 발생했습니다.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = (event) => {
    event.preventDefault();
    runAuthAction(() => signInWithEmail(signInForm), "로그인되었습니다.");
  };

  const handleSignUp = (event) => {
    event.preventDefault();
    runAuthAction(
      () => signUpWithEmail({ ...signUpForm, redirectTo }),
      "회원가입 요청을 보냈습니다. 메일함에서 인증 링크를 확인해주세요.",
    );
  };

  const handleGoogleSignIn = () => {
    runAuthAction(() => signInWithGoogle({ redirectTo }), "");
  };

  const handleKakaoSignIn = () => {
    runAuthAction(() => signInWithKakao({ redirectTo }), "");
  };
  
  const handleSignOut = () => {
    runAuthAction(() => signOut(), "로그아웃되었습니다.");
  };

  return (
    <main className="auth-page">
      <section className="hero-card">
        <p className="eyebrow">Supabase Auth Practice</p>
        <p className="hero-title">
          NEXT <br />
          로그인/회원가입 auth 실습
        </p>
        <p className="hero-description">
          이메일 계정과 Google 계정으로 로그인/회원가입을 빠르게 확인할 수
          있습니다.
        </p>
      </section>

      <section className="auth-card" aria-label="로그인 폼">
        <div className="card-header">
          <div>
            <p className="eyebrow">Account</p>
            <h2>
              {user ? "현재 세션" : mode === "signin" ? "로그인" : "회원가입"}
            </h2>
            {!user && (
              <p className="card-description">
                {mode === "signin"
                  ? "가입한 이메일 또는 Google 계정으로 로그인하세요."
                  : "이메일로 새 계정을 만들거나 Google로 바로 시작하세요."}
              </p>
            )}
          </div>
          <span className={user ? "session-badge active" : "session-badge"}>
            {user ? "로그인됨" : "게스트"}
          </span>
        </div>

        {user ? (
          <div className="session-panel">
            <dl>
              <div>
                <dt>이메일</dt>
                <dd>{user.email ?? "OAuth 계정"}</dd>
              </div>
              <div>
                <dt>Provider</dt>
                <dd>{user.app_metadata?.provider ?? "email"}</dd>
              </div>
              <div>
                <dt>User ID</dt>
                <dd>{user.id}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="secondary-button"
              onClick={handleSignOut}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <>
            <div className="mode-toggle" role="tablist" aria-label="인증 모드">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signin"}
                className={
                  mode === "signin" ? "mode-button active" : "mode-button"
                }
                onClick={() => setMode("signin")}
                disabled={isLoading}
              >
                로그인
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "signup"}
                className={
                  mode === "signup" ? "mode-button active" : "mode-button"
                }
                onClick={() => setMode("signup")}
                disabled={isLoading}
              >
                회원가입
              </button>
            </div>

            {mode === "signin" ? (
              <form className="auth-form" onSubmit={handleSignIn}>
                <label>
                  이메일
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={signInForm.email}
                    onChange={updateSignInForm}
                    disabled={isLoading}
                    required
                  />
                </label>

                <label>
                  비밀번호
                  <input
                    type="password"
                    name="password"
                    placeholder="비밀번호 입력"
                    value={signInForm.password}
                    onChange={updateSignInForm}
                    disabled={isLoading}
                    minLength={6}
                    required
                  />
                </label>

                <button type="submit" disabled={isLoading}>
                  이메일 로그인
                </button>
              </form>
            ) : (
              <form className="auth-form" onSubmit={handleSignUp}>
                <label>
                  이메일
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={signUpForm.email}
                    onChange={updateSignUpForm}
                    disabled={isLoading}
                    required
                  />
                </label>

                <label>
                  비밀번호
                  <input
                    type="password"
                    name="password"
                    placeholder="6자 이상 입력"
                    value={signUpForm.password}
                    onChange={updateSignUpForm}
                    disabled={isLoading}
                    minLength={6}
                    required
                  />
                </label>

                <button type="submit" disabled={isLoading}>
                  회원가입
                </button>
              </form>
            )}

            <div className="auth-divider">
              <span>또는</span>
            </div>

            <button
              type="button"
              className="google-button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <img
                src="/google-icon.png"
                alt="Google logo"
                className="google-icon"
              />
              Google 계정으로 계속하기
            </button>

            <button 
    type="button" 
    className="kakao-button" 
    onClick={handleKakaoSignIn} 
    disabled={isLoading}
  >
    <img
      src="/kakao-icon.png"
      alt="Kakao logo"
      className="kakao-icon"
    />
    카카오 계정으로 계속하기
  </button>
          </>
        )}

        {(status || errorMessage) && (
          <p
            className={errorMessage ? "message error" : "message"}
            role="status"
          >
            {errorMessage || status}
          </p>
        )}
      </section>
    </main>
  );
}

export default App;
