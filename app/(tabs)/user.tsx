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
  const [isSignUp, setIsSignUp] = useState(false);
  const [resetEmail, setResetEmail] = useState('');

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
    if (isSignUp) {
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
      Toast.show({ type: 'error', text1: translate('invalidPassword') });
      return;
    }

    try {
      if (isSignUp) {
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
    if (!validateEmail(resetEmail)) {
      Toast.show({ type: 'error', text1: translate('invalidEmail') });
      return;
    }
    try {
      auth.languageCode = i18n.locale; // Set the language code
      await sendPasswordResetEmail(auth, resetEmail);
      Toast.show({ type: 'success', text1: translate('resetEmailSent') });
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
    <SafeAreaView style={styles.centeredView}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 64} // Adjust the offset as needed
      >
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {userInfo && fireUser && (
            <>
              <Text style={styles.text}>
                {`${translate('hello')} ${userInfo.firstName} ${
                  userInfo.lastName
                }`}
              </Text>
              <Text style={styles.text}>{`<${fireUser.email}>`}</Text>
              <Text style={styles.text}>{`${getUserRoleText(userInfo)}`}</Text>
              <Button title={translate('signOut')} onPress={signOut} />
            </>
          )}
          {!userInfo && fireUser && <ActivityIndicator />}
          {!fireUser && (
            <>
              {isSignUp && (
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
                </>
              )}
              <TextInput
                placeholder={translate('email')}
                value={email}
                onChangeText={setEmail}
                style={styles.loginInput}
              />
              <TextInput
                placeholder={translate('password')}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.loginInput}
              />
              <Button
                title={isSignUp ? translate('signUp') : translate('signIn')}
                onPress={handleEmailPasswordAuth}
              />
              <Text style={styles.text}>{`${translate('or')}`}</Text>
              <Button
                title={
                  isSignUp
                    ? translate('switchToSignIn')
                    : translate('switchToSignUp')
                }
                onPress={() => setIsSignUp(!isSignUp)}
              />
              <Text style={styles.text}>{`${translate('or')}`}</Text>
              <Text style={styles.text}>{`${translate(
                'qForgotPassword'
              )}`}</Text>
              <TextInput
                placeholder={translate('email')}
                value={resetEmail}
                onChangeText={setResetEmail}
                style={styles.loginInput}
              />
              <Button
                title={translate('resetPassword')}
                onPress={handlePasswordReset}
              />
            </>
          )}
          <Toast config={toastConfig} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
