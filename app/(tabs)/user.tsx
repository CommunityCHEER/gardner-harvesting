import { useState, useEffect, useContext } from 'react';
import { Text, ActivityIndicator, TextInput, Alert } from 'react-native';
import Button from '@/components/Button';
import { firebaseContext } from '@/context';
import {
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  User as FireUser,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import * as Apple from 'expo-apple-authentication';

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
  const [appleUser, setAppleUser] =
    useState<Apple.AppleAuthenticationCredential>();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  const i18n = useContext(i18nContext);
  const translate = i18n.t.bind(i18n);

  useEffect(GoogleSignin.configure, []);

  useEffect(() => {
    const effect = async () => {
      if (fireUser) {
        let userInfo = (
          await getDoc(doc(db, 'people', fireUser.uid))
        ).data() as UserInfo | undefined;
        if (!userInfo) {
          let lastName;
          let firstName;

          const googleUser = GoogleSignin.getCurrentUser();
          if (googleUser) {
            const googleUserInfo = googleUser.user;
            lastName = googleUserInfo?.familyName;
            firstName = googleUserInfo?.givenName;
          } else if (appleUser) {
            firstName = appleUser?.fullName?.givenName;
            lastName = appleUser?.fullName?.familyName;
          }

          userInfo = {
            firstName: firstName ?? '',
            lastName: lastName ?? '',
            role: '',
          };
          setDoc(doc(db, 'people', fireUser.uid), userInfo);
        }

        setUserInfo(userInfo);
      }
    };
    effect();
  }, [fireUser]);

  const signInGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const cred = GoogleAuthProvider.credential(
      tokens.idToken,
      tokens.accessToken
    );
    const res = await signInWithCredential(auth, cred);
    setFireUser(res.user);
  };

  const signInApple = async () => {
    const appleCred = await Apple.signInAsync({
      requestedScopes: [
        Apple.AppleAuthenticationScope.EMAIL,
        Apple.AppleAuthenticationScope.FULL_NAME,
      ],
    });
    let idToken = appleCred.identityToken ? appleCred.identityToken : '';
    let accessToken = appleCred.authorizationCode ?? '';
    setAppleUser(appleCred);
    const firebaseCred = new OAuthProvider('apple.com').credential({
      idToken,
      accessToken,
    });
    const res = await signInWithCredential(auth, firebaseCred);
    setFireUser(res.user);
  };

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
        Alert.alert('Error', 'First Name must be between 2 and 50 characters.');
        return;
      }
      if (lastName.length < 2 || lastName.length > 50) {
        Alert.alert('Error', 'Last Name must be between 2 and 50 characters.');
        return;
      }
    }
    if (!validateEmail(email)) {
      Alert.alert('Error', 'Invalid email format.');
      return;
    }
    if (!validatePassword(password)) {
      Alert.alert(
        'Error',
        'Password must be between 12 and 50 characters and contain at least 1 upper case letter, 1 lower case letter, 1 number, and 1 special character.'
      );
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
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Authentication failed.');
    }
  };

  const signOut = () => {
    auth.signOut();
    setFireUser(undefined);
    setUserInfo(undefined);
    if (GoogleSignin.getCurrentUser()) {
      GoogleSignin.signOut();
    }
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
      {fireUser && !userInfo && <ActivityIndicator />}
      {!fireUser && (
        <>
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signInGoogle}
          />
          {/* Will not render if apple authentication isn't available :D */}
          <Apple.AppleAuthenticationButton
            buttonType={Apple.AppleAuthenticationButtonType.SIGN_IN}
            style={{ width: 200, height: 44 }}
            buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
            onPress={signInApple}
          />
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          {isSignUp && (
            <>
              <TextInput
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                style={styles.input}
              />
              <TextInput
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                style={styles.input}
              />
            </>
          )}
          <Button
            title={isSignUp ? translate('signUp') : translate('signIn')}
            onPress={handleEmailPasswordAuth}
          />
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
    </SafeAreaView>
  );
}
