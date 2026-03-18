import { useState, useEffect, useContext } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Text,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Button from '@/components/Button';
import PasswordInput from '@/components/PasswordInput';
import { firebaseContext } from '@/context';
import Toast, {
  BaseToast,
  BaseToastProps,
  ToastConfig,
} from 'react-native-toast-message';
import {
  User as FireUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User as UserInfo } from '@/types/firestore';
import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteUser } from 'firebase/auth';

/**
 * A screen for user authentication, including sign-up, sign-in, and password reset.
 * @returns {JSX.Element} The rendered screen.
 */
export default function User() {
  const { auth, db } = useContext(firebaseContext);
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [fireUser, setFireUser] = useState<FireUser | undefined>(
    auth.currentUser as FireUser
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mode, setMode] = useState<'initial' | 'login' | 'register' | 'forgot'>('initial');

  const i18n = useContext(i18nContext);
  const translate = i18n.t.bind(i18n);

  const toastProps: BaseToastProps = {
    text1Style: {
      fontSize: 18,
    },
    text2Style: {
      fontSize: 14,
    },
    text1NumberOfLines: 0,
    style: {
      height: 'auto',
      paddingVertical: 10,
      paddingHorizontal: 0,
    },
  };
  const toastConfig: ToastConfig = {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        {...toastProps}
        style={[
          toastProps.style,
          {
            borderLeftColor: '#69C779',
          },
        ]}
      />
    ),
    error: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        {...toastProps}
        style={[
          toastProps.style,
          {
            borderLeftColor: '#FE6301',
          },
        ]}
      />
    ),
    warning: (props: BaseToastProps) => (
      <BaseToast
        {...props}
        {...toastProps}
        style={[
          toastProps.style,
          {
            borderLeftColor: '#FFC107',
          },
        ]}
      />
    ),
  };

  useEffect(() => {
    const effect = async () => {
      if (fireUser) {
        let userInfo = (
          await getDoc(doc(db, 'people', fireUser.uid))
        ).data() as UserInfo | undefined;
        const idToken = await fireUser.getIdTokenResult();
        if (!userInfo) {
          setDoc(doc(db, 'people', fireUser.uid), userInfo);
        }
        if (userInfo && idToken.claims.admin) userInfo.admin = true;
        if (userInfo && idToken.claims.gardener) userInfo.gardener = true;
        if (userInfo && idToken.claims.developer) userInfo.developer = true;
        setUserInfo(userInfo);
      }
    };
    effect();
  }, [fireUser]);

  const validateEmail = (email: string) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailPattern.test(email);
  };
  const validatePassword = (password: string) => {
    const passwordPattern =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,'"?/]).{12,50}$/;
    return passwordPattern.test(password);
  };
  const handleEmailPasswordAuth = async () => {
    if (mode === 'register') {
      if (firstName.length < 2 || firstName.length > 50) {
        Toast.show({ type: 'error', text1: translate('firstNameLength') });
        return;
      }
      if (lastName.length < 2 || lastName.length > 50) {
        Toast.show({ type: 'error', text1: translate('lastNameLength') });
        return;
      }
    }
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: translate('invalidEmail') });
      return;
    }
    if (!validatePassword(password)) {
      return;
    }

    try {
      if (mode === 'register') {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        const userInfo = {
          firstName,
          lastName,
          role: '',
          admin: false,
          gardener: false,
          developer: false,
        };

        await setDoc(doc(db, 'people', res.user.uid), userInfo);

        setUserInfo(userInfo);
        setFireUser(res.user);
      } else {
        const res = await signInWithEmailAndPassword(auth, email, password);

        setFireUser(res.user);
      }
    } catch (error: any) {
      console.error(error);
      const errorMessage = (error.message as string).includes(
        'email-already-in-use'
      )
        ? translate('emailAlreadyRegistered')
        : (error.message as string).includes('invalid-credential')
          ? translate('invalidCredential')
          : error.message;
      Toast.show({ type: 'error', text1: errorMessage });
    }
  };
  const handlePasswordReset = async () => {
    if (!validateEmail(email)) {
      Toast.show({ type: 'error', text1: translate('invalidEmail') });
      return;
    }
    try {
      auth.languageCode = i18n.locale; // Set the language code
      await sendPasswordResetEmail(auth, email);
      Toast.show({ type: 'success', text1: translate('resetEmailSent') });
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: error.message });
    }
  };
  const handleDeleteAccount = async () => {
    if (!fireUser) return;

    try {
      await deleteUser(fireUser);
      Toast.show({ type: 'success', text1: translate('accountDeleted') });
      signOut();
    } catch (error: any) {
      console.error(error);
      Toast.show({ type: 'error', text1: error.message });
    }
  };

  const signOut = () => {
    auth.signOut();
    setFireUser(undefined);
    setUserInfo(undefined);
  };
  const getUserRoleText = (claims: UserInfo) => {
    if (claims.developer) {
      return translate('youAreDeveloper');
    } else if (claims.admin) {
      return translate('youAreAdmin');
    } else if (claims.gardener) {
      return translate('youAreGardener');
    } else {
      return translate('youHaveNoRole');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64} // Adjust the offset as needed
      >
        <ScrollView
          contentContainerStyle={styles.userScrollViewContent}
          keyboardShouldPersistTaps="handled"
        >
          {userInfo && fireUser && (
            <>
              <Text style={styles.text}>
                {`${translate('hello')}, ${userInfo.firstName} ${userInfo.lastName
                  }`}
              </Text>
              {/* <Text style={styles.text}>{`<${fireUser.email}>`}</Text> */}
              {/* <Text style={styles.text}>{`${getUserRoleText(userInfo)}`}</Text> */}
              <Button title={translate('signOut')} onPress={signOut} />
              <Button
                title={translate('deleteAccount')}
                onPress={handleDeleteAccount}
              />
            </>
          )}
          {!userInfo && fireUser && <ActivityIndicator />}
          {!fireUser && (
            <>
              {mode === 'initial' && (
                <>
                  <Button
                    title={translate('signIn')}
                    onPress={() => setMode('login')}
                  />
                  <Text style={styles.text}>{translate('or')}</Text>
                  <Button
                    title={translate('switchToSignUp')}
                    onPress={() => setMode('register')}
                  />
                </>
              )}
              {mode === 'login' && (
                <>
                  <TextInput
                    placeholder={translate('email')}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.loginInput}
                  />
                  <PasswordInput
                    placeholder={translate('password')}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.loginInput}
                  />
                  {password.length > 0 && !validatePassword(password) && (
                    <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginHorizontal: 16, marginTop: 4 }}>
                      {translate('invalidPassword')}
                    </Text>
                  )}
                  <Button
                    title={translate('authSubmit')}
                    onPress={handleEmailPasswordAuth}
                  />
                  <Button
                    title={translate('qForgotPassword')}
                    variant="secondary"
                    onPress={() => setMode('forgot')}
                  />
                  <Button
                    title={translate('goBack')}
                    onPress={() => setMode('initial')}
                  />
                </>
              )}
              {mode === 'forgot' && (
                <>
                  <TextInput
                    placeholder={translate('email')}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.loginInput}
                  />
                  <Button
                    title={translate('resetPassword')}
                    onPress={handlePasswordReset}
                  />
                  <Button
                    title={translate('goBack')}
                    onPress={() => setMode('login')}
                  />
                </>
              )}
              {mode === 'register' && (
                <>
                  <TextInput
                    placeholder={translate('firstName')}
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.loginInput}
                  />
                  <TextInput
                    placeholder={translate('lastName')}
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.loginInput}
                  />
                  <TextInput
                    placeholder={translate('email')}
                    value={email}
                    onChangeText={setEmail}
                    style={styles.loginInput}
                  />
                  <PasswordInput
                    placeholder={translate('password')}
                    value={password}
                    onChangeText={setPassword}
                    style={styles.loginInput}
                  />
                  {password.length > 0 && !validatePassword(password) && (
                    <Text style={{ fontSize: 13, color: '#666', textAlign: 'center', marginHorizontal: 16, marginTop: 4 }}>
                      {translate('invalidPassword')}
                    </Text>
                  )}
                  <Button
                    title={translate('authSubmit')}
                    onPress={handleEmailPasswordAuth}
                  />
                  <Button
                    title={translate('goBack')}
                    onPress={() => setMode('initial')}
                  />
                </>
              )}
            </>
          )}
          <Toast config={toastConfig} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
