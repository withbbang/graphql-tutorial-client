import React from 'react';
import {Query, Mutation} from 'react-apollo';
import {gql} from 'apollo-boost';
import {ROOT_QUERY} from './App';

const ADD_FAKE_USERS_MUTATION = gql`
    mutation addFakeUsers($count:Int!) {
        addFakeUsers(count:$count) {
            githubLogin
            name
            avatar
        }
    }
`

const updateUserCache = (cache, { data:{ addFakeUsers } }) => {
    let data = cache.readQuery({ query: ROOT_QUERY });
    data.totalUsers += addFakeUsers.length;
    data.allUsers = [
        ...data.allUsers,
        ...addFakeUsers
    ];
    cache.writeQuery({ query: ROOT_QUERY, data });
}   

const Users = () =>
    <Query query={ROOT_QUERY} fetchPolicy="cache-and-network">
        {({data, loading, refetch}) => loading ? 
            <p>사용자 불러오는 중...</p> : 
                <UserList
                    count = {data.totalUsers}
                    users = {data.allUsers}
                    refetchUsers = {refetch}
                />
        }
    </Query>;

const UserList = ({count, users, refetchUsers}) =>
    <div>
        <p>{count} Users</p>
        <button onClick = {() => refetchUsers()}>다시 가져오기</button>
        {/* 리페치로 네트워크 요청을 하지 않고 캐시에서 추가된 유저만 넣는 로직 근데 리렌더링이 되지 않음
            20210922 확인해보기
            <Mutation
            mutation={ADD_FAKE_USERS_MUTATION}
            update = {updateUserCache}
            variables = {{count: 1}}
        > */}
        <Mutation
            mutation = {ADD_FAKE_USERS_MUTATION}
            variables = {{count: 1}}
            refetchQueries = {[{query: ROOT_QUERY}]}
        >
            {addFakeUsers =>
                <button onClick = {addFakeUsers}>임시 사용자 추가</button>
            }
        </Mutation>
        <ul>
            {users.map(user =>
                <UserListItem
                    key = {user.githubLogin}
                    name = {user.name}
                    avatar = {user.avatar}
                />
            )}
        </ul>
    </div>;

const UserListItem = ({name, avatar}) =>
    <li>
        <img src={avatar} width={48} height={48} alt=""/>
        {name}
    </li>

export default Users;