import { useState, useEffect, useContext } from 'react';
import { Text, ActivityIndicator, TextInput } from 'react-native';
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
        if (!userInfo) {
          setDoc(doc(db, 'people', fireUser.uid), userInfo);
        }
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

  const signOut = () => {
    auth.signOut();
    setFireUser(undefined);
    setUserInfo(undefined);
  };

  return (
    <SafeAreaView style={styles.centeredView}>
      {userInfo && fireUser && (
        <>
          <Text style={styles.text}>
            {`${translate('hello')} ${userInfo.firstName} ${userInfo.lastName}`}
          </Text>
          <Text style={styles.text}>{`<${fireUser.email}>`}</Text>
          <Button title={translate('signOut')} onPress={signOut} />
        </>
      )}
      {!userInfo && fireUser && <ActivityIndicator />}
      {!fireUser && (
        <>
          {isSignUp && (
            <>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.loginInput}
              />
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.loginInput}
              />
            </>
          )}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.loginInput}
          />
          <TextInput
            placeholder="Password"
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
        </>
      )}
      <Toast config={toastConfig} />
    </SafeAreaView>
  );
}
