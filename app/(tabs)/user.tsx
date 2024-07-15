import { useState, useEffect, useContext } from 'react';
import { View, Text, ActivityIndicator, Button } from 'react-native';
import { firebaseContext } from '@/authContext';
import { GoogleAuthProvider, OAuthProvider, signInWithCredential, User as FireUser } from 'firebase/auth';
import {
  GoogleSignin,
  GoogleSigninButton,
} from '@react-native-google-signin/google-signin';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import * as Apple from 'expo-apple-authentication'

import { User as UserInfo } from '@/types/firestore';

import { i18nContext } from '@/i18n';
import { styles } from '@/constants/style';

export default function User() {
  const { auth, db } = useContext(firebaseContext);
  const [userInfo, setUserInfo] = useState<UserInfo>();
  const [fireUser, setFireUser] = useState<FireUser | undefined>(auth.currentUser as FireUser);
  const [appleUser, setAppleUser] = useState<Apple.AppleAuthenticationCredential>();
  // const [error, setError] = useState<string>();

  const i18n = useContext(i18nContext);
  const t = i18n.t.bind(i18n);

  useEffect(GoogleSignin.configure, []);

  useEffect(() => {
    const effect = async () => {
      if (fireUser) {
        let userInfo = (await getDoc(doc(db, 'people', fireUser.uid))).data() as UserInfo | undefined;
        if (!userInfo) {
          let lastName;
          let firstName;

          const googleUser = GoogleSignin.getCurrentUser();
          if (googleUser) {
            const googleUserInfo = googleUser.user;
            lastName = googleUserInfo?.familyName;
            firstName = googleUserInfo?.givenName;
          }
          else if (appleUser) {
            firstName = appleUser?.fullName?.givenName;
            lastName = appleUser?.fullName?.familyName;
          }

          userInfo = {
            "first name": firstName ?? '',
            "last name": lastName ?? ''
          }
          await setDoc(doc(db, 'people', fireUser.uid), userInfo);

        }

        setUserInfo(userInfo);
      }
    }
    effect()
  }, [fireUser])

  const signInGoogle = async () => {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signIn();
    const tokens = await GoogleSignin.getTokens();
    const cred = GoogleAuthProvider.credential(tokens.idToken, tokens.accessToken);
    const res = await signInWithCredential(auth, cred);
    setFireUser(res.user);
  };

  const signInApple = async () => {
    const appleCred = await Apple.signInAsync({ requestedScopes: [Apple.AppleAuthenticationScope.EMAIL, Apple.AppleAuthenticationScope.FULL_NAME] });
    let idToken = appleCred.identityToken ? appleCred.identityToken : '';
    let accessToken = appleCred.authorizationCode ?? '';
    setAppleUser(appleCred);
    const firebaseCred = new OAuthProvider('apple.com')
      .credential({
        idToken,
        accessToken
      });
    const res = await signInWithCredential(auth, firebaseCred);
    setFireUser(res.user);
  }

  const signOut = async () => {
    console.warn(auth.currentUser?.providerId);
    await auth.signOut();
    setFireUser(undefined);
    setUserInfo(undefined);
    if (GoogleSignin.getCurrentUser()) {
      await GoogleSignin.signOut();
    }
  }

  return <View style={styles.centeredView}>
    {userInfo && fireUser && <>
      <Text> {t('hello')} {`${userInfo["first name"]} ${userInfo["last name"]} <${fireUser.email}>`} </Text>
      <Button title={t('signOut')} onPress={signOut} />
    </>}
    {fireUser && !userInfo && <ActivityIndicator />}
    {/*error && <Text> {error} </Text>*/}
    {!fireUser && <GoogleSigninButton
      size={GoogleSigninButton.Size.Wide}
      color={GoogleSigninButton.Color.Dark}
      onPress={signInGoogle}
    />}
    {/* Will not render if apple authentication isn't available :D */}
    <Apple.AppleAuthenticationButton
      buttonType={Apple.AppleAuthenticationButtonType.SIGN_IN}
      buttonStyle={Apple.AppleAuthenticationButtonStyle.BLACK}
      onPress={signInApple}
    />
  </View >;
}
