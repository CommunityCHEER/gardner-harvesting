import { Firestore, doc, setDoc } from 'firebase/firestore';
import { Participation } from '@/types/firestore';
import { getDateString } from '@/utility/functions';

const assertNotFutureDate = (date: string) => {
    const today = getDateString();
    if (date > today) {
        throw new Error('date cannot be in the future');
    }
};

export const logParticipationForUser = async (
    db: Firestore,
    uid: string,
    gardenId: string,
    date = getDateString()
) => {
    assertNotFutureDate(date);
    const participation: Participation = {
        date,
        garden: doc(db, 'gardens', gardenId),
    };

    await setDoc(doc(db, 'people', uid, 'participation', date), participation);
};
