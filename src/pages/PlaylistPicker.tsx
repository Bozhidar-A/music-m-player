import firebase from 'firebase';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardBody, Container } from 'reactstrap';
import IPageProps from '../interfaces/page';
import {useCollectionData, useDocument, useDocumentData} from 'react-firebase-hooks/firestore';
import { List, arrayMove } from 'react-movable';
import { auth } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';


const PlaylistPicker: React.FunctionComponent<IPageProps> = props => {
    const [playlists, setPlaylists] = useState<Array<{
        name: string,
        doc: string
    }>>([]);
    
    var db = firebase.firestore()

    useEffect(() => {
        db.collection("testbruh").doc(auth.currentUser?.uid).get().then(doc => {
            if(doc.exists)
            {
                setPlaylists(doc.data()!.arr)
            }
        })
    }, [])

    function EachPlaylist(props:any)
    {
        console.log(props)
        return(<div>
            <p>{props.data.name}</p>
            <Link to={{pathname:`/playlist/${props.data.doc}`, state: { playlistsDocID: props.data.doc} }}>View Playlist</Link>
        </div>)
    }

    function CreatePlaylist()
    {
        var name = prompt();
        if(name !== null)
        {
            setPlaylists(arr => [{name:name!, doc:"bruh"}, ...arr]);
            db.collection("testbruh").doc(auth.currentUser?.uid).update({
                arr: firebase.firestore.FieldValue.arrayUnion({name:name, doc:"bruh"})
            })
        }
    }

    return (
        <div>
            <button onClick={CreatePlaylist}>Create Playlist</button>
            {playlists && <List
                values={playlists}
                onChange={({ oldIndex, newIndex }) =>
                    {
                        var temp = arrayMove(playlists, oldIndex, newIndex);

                        setPlaylists(temp);
                        
                        //I don't like this. I am rewriting the whole array instead of changing the order.
                        //TODO fix this
                        db.collection("testbruh").doc(auth.currentUser?.uid).set({
                            arr: temp
                        })
                    } 
                }
                renderList={({ children, props }) => <ul {...props}>{children}</ul>}
                renderItem={({ value, props }) => <li {...props}><EachPlaylist key={uuidv4()} data={value}/></li>}
        /> }
        </div>
        
    );
}

export default PlaylistPicker;

