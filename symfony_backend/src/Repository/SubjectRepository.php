<?php

namespace App\Repository;

use App\Entity\Subject;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Subject>
 */
class SubjectRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Subject::class);
    }

    // Get subjects linked to a specific student
    public function findSubjectsByStudent(int $studentId): array
    {
        return $this->createQueryBuilder('s')
            ->innerJoin('s.students', 'st') // 'students' is the property in Subject entity
            ->where('st.id = :studentId')
            ->setParameter('studentId', $studentId)
            ->getQuery()
            ->getArrayResult();
    }
}
